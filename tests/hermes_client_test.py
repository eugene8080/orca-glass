"""No Hermes imports, owner, real credentials or live prompts in these checks."""
import asyncio
import importlib.util
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import sys
import io
import tempfile
import sqlite3
import json

spec = importlib.util.spec_from_file_location("hermes_bridge", Path(__file__).parents[1] / "bridge/hermes-client.py")
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)
endpoint = SimpleNamespace(profile_id="synthetic-profile", instance_id="owner-1", authority_epoch=2)


class Peer:
    def __init__(self):
        self.row = {"session_id": "exact-id", "started_at": 123, "source": "desktop"}
        self.sent = []
        self.resume_id = "exact-id"
        self.prompts = []
        self.change_on_read = False
        self.change_on_resume = False
        self.status = "idle"
        self.calls = []
        self.responded = []
        self.respond_status = "resolved"

    async def rpc(self, method, **args):
        self.calls.append(method)
        if method == "session.list":
            return {"sessions": [dict(self.row)] if args["scope"] == "live" else []}
        if method == "session.active_list":
            return {"sessions": [{"id": "exact-id", "status": self.status}]}
        if method == "session.history":
            if self.change_on_read:
                self.row["started_at"] += 1
            return {"messages": [{"role": "assistant", "content": "safe reply"}]}
        if method == "session.resume":
            if self.change_on_resume:
                self.row["session_id"] = "replacement"
            return {"session_id": self.resume_id, "authority_epoch": 2,
                    "info": {"profile_id": endpoint.profile_id}, "prompts": self.prompts}
        if method == "clarify.respond":
            self.responded.append(args)
            return {"status": self.respond_status, "prompt_id": args["prompt_id"]}
        if method == "prompt.submit":
            self.sent.append(args)
            return {"ref": {"session_id": args["session_id"], "profile_id": endpoint.profile_id},
                    "authority_epoch": 2, "status": "queued"}
        raise AssertionError(method)


class Guards(unittest.IsolatedAsyncioTestCase):
    async def test_send_exact_and_guard_replacements(self):
        for mutation in (None, "profile", "epoch", "source", "resume", "attention", "race"):
            peer = Peer()
            target = bridge.identity(endpoint, peer.row)
            if mutation in ("profile", "epoch", "source"):
                target[mutation] = "different"
            if mutation == "resume": peer.resume_id = "different"
            if mutation == "attention": peer.prompts = [{"prompt_id": "question"}]
            if mutation == "race": peer.change_on_resume = True
            request = {"action": "send", "target": target, "text": "synthetic confirmed input", "submissionId": "one"}
            if mutation:
                with self.assertRaises(bridge.StaleTarget):
                    await bridge.operation(peer, endpoint, Path("unused"), request)
                self.assertEqual(peer.sent, [])
            else:
                self.assertEqual(await bridge.operation(peer, endpoint, Path("unused"), request), {"accepted": True})
                self.assertEqual(len(peer.sent), 1)
                self.assertEqual(peer.sent[0]["session_id"], "exact-id")

    async def test_read_race_never_returns_other_conversation(self):
        peer = Peer()
        request = {"action": "read", "target": bridge.identity(endpoint, peer.row)}
        peer.change_on_read = True
        with self.assertRaises(bridge.StaleTarget):
            await bridge.operation(peer, endpoint, Path("unused"), request)
        self.assertEqual(peer.sent, [])

    def test_only_visible_messages(self):
        result = bridge.visible_messages([
            {"role": "tool", "content": "secret tool payload"},
            {"role": "assistant", "reasoning": "secret thought", "text": "answer"},
            {"role": "user", "content": [{"type": "text", "text": "question"}, {"type": "image", "text": "not text"}]},
            {"role": "system", "content": "system instructions"}])
        self.assertEqual(result["messages"], [{"role": "assistant", "text": "answer"}, {"role": "user", "text": "question"}])

    def test_stored_compression_binding_and_display_projection(self):
        rows = {"root": {"started_at": 100, "source": "desktop"},
                "child": {"started_at": 200, "source": "desktop"}}
        history = [{"role": "user", "content": "scaffold", "display_kind": "hidden"},
                   {"role": "assistant", "content": "reply"}]
        class DB:
            def __init__(self, **kwargs):
                self.closed = False
                self.kwargs = kwargs
                instances.append(self)
            def get_session(self, sid): return rows.get(sid)
            def get_compression_tip(self, sid): return tips.get(sid)
            def get_messages_as_conversation(self, sid, **kwargs):
                self.read = (sid, kwargs)
                return history
            def close(self): self.closed = True
        instances, tips, projected = [], {"root": "child"}, []
        def projection(raw, home):
            projected.append((raw, home))
            # Exercise the canonical adapter boundary, including the sidecar's
            # stream mutation; no installed Hermes import or real DB is needed.
            sys.stdout = io.StringIO()
            return [{"role": "assistant", "text": "display reply"}]
        row = {"id": "root", "session_id": "child", "started_at": 100, "source": "desktop"}
        with patch.dict(sys.modules, {"hermes_state": SimpleNamespace(SessionDB=DB),
                "gateway.session_controls": SimpleNamespace(display_projection=projection)}):
            output = sys.stdout
            self.assertEqual(bridge.stored_history(Path("synthetic"), row),
                             [{"role": "assistant", "text": "display reply"}])
            self.assertIs(sys.stdout, output)
            self.assertEqual(projected, [(history, Path("synthetic"))])
            self.assertEqual(instances[-1].read, ("child", {"include_ancestors": True}))
            self.assertTrue(instances[-1].kwargs["read_only"])
            for mutation in ("timestamp", "tip", "source", "hidden", "missing"):
                with self.subTest(mutation=mutation):
                    changed = dict(row)
                    if mutation == "timestamp": changed["started_at"] = 200
                    if mutation == "tip": tips["root"] = "new-child"
                    if mutation == "source": changed["source"] = "different"
                    if mutation == "hidden": rows["root"]["hidden"] = True
                    if mutation == "missing": changed["id"] = "unknown"
                    with self.assertRaises(bridge.StaleTarget):
                        bridge.stored_history(Path("synthetic"), changed)
                    tips["root"] = "child"
                    rows["root"].pop("hidden", None)
            self.assertTrue(all(db.closed for db in instances))

    def test_hidden_and_model_only_rows_are_defensively_excluded(self):
        self.assertEqual(bridge.visible_messages([
            {"role": "user", "content": "hidden", "display_kind": "hidden"},
            {"role": "user", "content": "merge", "display_metadata": {"model_only": True}},
            {"role": "assistant", "text": "visible"}])["messages"],
            [{"role": "assistant", "text": "visible"}])

    def test_profile_receipt_binding_reads_only_local_ownership_fields(self):
        with tempfile.TemporaryDirectory() as temp:
            home = Path(temp)
            with sqlite3.connect(home / 'state.db') as db:
                db.execute('CREATE TABLE state_meta (key TEXT, value TEXT)')
                for sid, remote in [('local', False), ('remote', True)]:
                    receipt = {'policy': {'client_env_remote': remote, 'client_env_json': json.dumps({
                        'ORCA_PANE_KEY': 'tab:leaf', 'ORCA_WORKTREE_ID': 'workspace',
                        'ORCA_AGENT_HOOK_TOKEN': 'must-never-cross-boundary'})}}
                    db.execute('INSERT INTO state_meta VALUES (?,?)', ('gateway.local_policy.v1:' + sid, json.dumps(receipt)))
            db.close()
            self.assertEqual(bridge.orca_bindings(home, ['local', 'remote', 'missing']), {
                'local': {'paneKey': 'tab:leaf', 'worktreeId': 'workspace'}})

    async def test_unavailable_profile_preserves_other_profiles(self):
        original = bridge.inspect_profile
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'profiles' / 'available').mkdir(parents=True)
            (root / 'profiles' / 'available' / 'state.db').touch()
            async def fake(name, home, request):
                if name == 'default': raise TimeoutError()
                return {'sessions': [{'synthetic': True}], 'unavailableProfiles': 0}
            bridge.inspect_profile = fake
            try:
                result = await bridge.main({'action': 'list', 'root': str(root)})
                self.assertEqual(result, {'sessions': [{'synthetic': True}], 'unavailableProfiles': 1})
            finally:
                bridge.inspect_profile = original



class ClarifyQuestions(unittest.TestCase):
    def test_full_arguments_parse_even_with_trailing_text(self):
        questions = [{"question": "Pin the synthetic job?", "choices": ["Yes (Recommended)", "No"]},
                     {"question": "Run it now?", "choices": ["Yes", "No"]}]
        arguments = json.dumps({"questions": json.dumps(questions) + "]"})  # model appended stray text
        self.assertEqual(bridge.clarify_questions(arguments), questions)
        self.assertEqual(bridge.clarify_questions({"questions": questions}), questions)

    def test_malformed_and_unbounded_input_is_safe(self):
        self.assertEqual(bridge.clarify_questions("not json"), [])
        self.assertEqual(bridge.clarify_questions({"questions": [{"choices": ["x"]}, "bad"]}), [])
        many = [{"question": f"Q{i}", "choices": [str(n) for n in range(20)]} for i in range(9)]
        parsed = bridge.clarify_questions({"questions": many})
        self.assertEqual(len(parsed), 5)
        self.assertEqual(len(parsed[0]["choices"]), 10)


class PendingQuestionSend(unittest.IsolatedAsyncioTestCase):
    async def test_open_question_reports_a_pending_question_not_a_changed_session(self):
        peer = Peer()
        peer.prompts = [{"prompt_id": "synthetic-question", "kind": "clarify"}]
        request = {"action": "send", "target": bridge.identity(endpoint, peer.row), "text": "synthetic", "submissionId": "one"}
        with self.assertRaises(bridge.PendingQuestion):
            await bridge.operation(peer, endpoint, Path("unused"), request)
        self.assertEqual(peer.sent, [])

BATCH = [{"question": "Pin the job to Hong Kong time?", "choices": ["Yes (Recommended)", "No"]},
         {"question": "Post the sheet now?", "choices": ["Yes, post it now", "No, wait"]}]


def card(index=1, prompt_id="synthetic-q2", generation=7, **extra):
    # Shape of a canonical pending prompt from a messaging surface: the question
    # carries the typed-skip hint on its own line.
    return {"kind": "clarify", "prompt_id": prompt_id, "execution_generation": generation,
            "question": BATCH[index]["question"] + '\nReply "skip" to skip this question.',
            "choices": list(BATCH[index]["choices"]), "multi_select": False, **extra}


class ClarifyAnswer(unittest.IsolatedAsyncioTestCase):
    def test_open_prompt_becomes_a_numbered_menu_with_batch_position(self):
        menu = bridge.prompt_menu(card(), BATCH)
        self.assertEqual(menu["question"], "? (2/2) Post the sheet now?")
        self.assertEqual(menu["options"], [{"value": "1", "label": "Yes, post it now"}, {"value": "2", "label": "No, wait"}])
        self.assertEqual(len(menu["id"]), 64)
        # Without the stored batch the skip hint is still not shown.
        self.assertEqual(bridge.prompt_menu(card())["question"], "? Post the sheet now?")
        # Same wording in a new prompt instance or turn is a different menu.
        self.assertNotEqual(menu["id"], bridge.prompt_menu(card(prompt_id="other"))["id"])
        self.assertNotEqual(menu["id"], bridge.prompt_menu(card(generation=8))["id"])

    def test_only_single_select_clarify_with_two_to_nine_choices_is_a_menu(self):
        self.assertIsNone(bridge.prompt_menu(card(multi_select=True)))
        self.assertIsNone(bridge.prompt_menu({**card(), "kind": "approval"}))
        self.assertIsNone(bridge.prompt_menu(card(choices=["only"])))
        self.assertIsNone(bridge.prompt_menu(card(choices=[str(n) for n in range(10)])))
        self.assertIsNone(bridge.prompt_menu(card(execution_generation="7")))
        self.assertEqual(bridge.answerable([card()]), "choice")
        self.assertEqual(bridge.answerable([card(choices=[])]), "text")
        self.assertIsNone(bridge.answerable([card(multi_select=True)]))
        self.assertIsNone(bridge.answerable([card(), card(prompt_id="second")]))
        self.assertIsNone(bridge.answerable([]))

    async def read(self, peer, with_prompt):
        request = {"action": "read", "target": bridge.identity(endpoint, peer.row), "withPrompt": with_prompt}
        with patch.object(bridge, "pending_clarify", lambda home, sid: BATCH):
            return await bridge.operation(peer, endpoint, Path("unused"), request)

    async def test_read_attaches_only_when_asked_and_a_question_is_stored(self):
        peer = Peer()
        peer.status, peer.prompts = "waiting", [card()]
        result = await self.read(peer, True)
        self.assertEqual(result["menu"], bridge.prompt_menu(card(), BATCH))
        self.assertEqual(result["answerable"], "choice")
        self.assertTrue(result["promptChecked"])
        peer.calls.clear()
        result = await self.read(peer, False)
        self.assertNotIn("session.resume", peer.calls)
        self.assertNotIn("menu", result)
        idle = Peer()
        idle.prompts = [card()]
        result = await self.read(idle, True)
        self.assertEqual(result["questions"], [])
        self.assertNotIn("session.resume", idle.calls)
        self.assertEqual(peer.responded + idle.responded, [])

    async def answer(self, peer, menu_id, value="2"):
        request = {"action": "answer", "target": bridge.identity(endpoint, peer.row), "menuId": menu_id, "value": value}
        return await bridge.operation(peer, endpoint, Path("unused"), request)

    async def test_answer_sends_the_exact_choice_text_to_the_exact_prompt(self):
        peer = Peer()
        peer.status, peer.prompts = "waiting", [card()]
        menu = bridge.prompt_menu(card(), BATCH)
        self.assertEqual(await self.answer(peer, menu["id"]), {"sent": "No, wait"})
        self.assertEqual(peer.responded, [{"session_id": "exact-id", "execution_generation": 7,
                                           "prompt_id": "synthetic-q2", "answer": "No, wait", "_timeout": 8}])
        self.assertEqual(peer.sent, [])

    async def test_answer_refuses_a_changed_answered_or_unknown_question(self):
        menu = bridge.prompt_menu(card(), BATCH)
        for case in ("next question", "no prompt", "already answered", "session replaced"):
            peer = Peer()
            peer.status, peer.prompts = "waiting", [card()]
            if case == "next question": peer.prompts = [card(prompt_id="synthetic-q3")]
            if case == "no prompt": peer.prompts = []
            if case == "already answered": peer.respond_status = "already_resolved"
            if case == "session replaced": peer.change_on_resume = True
            with self.assertRaises(bridge.StaleTarget, msg=case):
                await self.answer(peer, menu["id"])
            if case != "already answered":
                self.assertEqual(peer.responded, [], case)
            self.assertEqual(peer.sent, [], case)
        for menu_id, value in ((menu["id"], "3"), (menu["id"], "x"), ("short", "1")):
            peer = Peer()
            peer.prompts = [card()]
            with self.assertRaises(ValueError):
                await self.answer(peer, menu_id, value)
            self.assertEqual(peer.responded, [])

    async def test_spoken_reply_answers_only_an_open_ended_question(self):
        peer = Peer()
        peer.prompts = [card(choices=[])]
        request = {"action": "send", "target": bridge.identity(endpoint, peer.row), "text": " synthetic answer ", "submissionId": "one"}
        self.assertEqual(await bridge.operation(peer, endpoint, Path("unused"), request), {"accepted": True})
        self.assertEqual([r["answer"] for r in peer.responded], ["synthetic answer"])
        self.assertEqual(peer.sent, [])
        for prompts in ([card()], [card(choices=[], multi_select=True)], [{"kind": "approval", "prompt_id": "a"}]):
            peer = Peer()
            peer.prompts = prompts
            with self.assertRaises(bridge.PendingQuestion):
                await bridge.operation(peer, endpoint, Path("unused"), request)
            self.assertEqual((peer.sent, peer.responded), ([], []))


if __name__ == "__main__":
    suite = unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromTestCase(case)
                               for case in (Guards, ClarifyQuestions, PendingQuestionSend, ClarifyAnswer))
    result = unittest.TextTestRunner().run(suite)
    if not result.wasSuccessful(): raise SystemExit(1)
    print("Hermes helper synthetic checks passed")
