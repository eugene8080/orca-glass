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

    async def rpc(self, method, **args):
        if method == "session.list":
            return {"sessions": [dict(self.row)] if args["scope"] == "live" else []}
        if method == "session.active_list":
            return {"sessions": [{"id": "exact-id", "status": "idle"}]}
        if method == "session.history":
            if self.change_on_read:
                self.row["started_at"] += 1
            return {"messages": [{"role": "assistant", "content": "safe reply"}]}
        if method == "session.resume":
            if self.change_on_resume:
                self.row["session_id"] = "replacement"
            return {"session_id": self.resume_id, "authority_epoch": 2,
                    "info": {"profile_id": endpoint.profile_id}, "prompts": self.prompts}
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

if __name__ == "__main__":
    suite = unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromTestCase(case)
                               for case in (Guards, ClarifyQuestions, PendingQuestionSend))
    result = unittest.TextTestRunner().run(suite)
    if not result.wasSuccessful(): raise SystemExit(1)
    print("Hermes helper synthetic checks passed")
