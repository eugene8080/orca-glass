"""No Hermes imports, owner, real credentials or live prompts in these checks."""
import asyncio
import importlib.util
from pathlib import Path
from types import SimpleNamespace
import unittest
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


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(Guards)
    result = unittest.TextTestRunner().run(suite)
    if not result.wasSuccessful(): raise SystemExit(1)
    print("Hermes helper synthetic checks passed")
