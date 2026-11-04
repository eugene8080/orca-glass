"""Small JSON/stdin boundary to the user's existing Hermes runtime (never starts it).

Only the installed client mints tickets, through its authenticated same-user pipe.
No credential, tool payload, reasoning or raw exception crosses this boundary.
"""
from __future__ import annotations

import asyncio
from contextlib import closing
import json
import os
from pathlib import Path
import sys
import time


class StaleTarget(ValueError):
    pass


def identity(endpoint, row):
    return {"profile": endpoint.profile_id, "instance": endpoint.instance_id,
            "epoch": endpoint.authority_epoch, "session": row["session_id"],
            "started": row.get("started_at"), "source": row.get("source")}


def visible_messages(rows):
    out = []
    for row in rows:
        if (row.get("role") not in ("user", "assistant")
                or row.get("display_kind") == "hidden"
                or (isinstance(row.get("display_metadata"), dict)
                    and row["display_metadata"].get("model_only"))):
            continue
        # Display projections put visible text in `text`; stored DB uses `content`.
        content = row.get("text", row.get("content", ""))
        if isinstance(content, list):
            content = "\n".join(b.get("text", "") for b in content
                                if isinstance(b, dict) and b.get("type") == "text"
                                and isinstance(b.get("text"), str))
        if isinstance(content, str) and content.strip():
            out.append({"role": row["role"], "text": content.strip()})
    # Keep complete recent messages and explicitly report any truncation.
    kept, size = [], 0
    for row in reversed(out):
        if size + len(row["text"]) > 1_000_000:
            break
        kept.append(row)
        size += len(row["text"])
    return {"messages": list(reversed(kept)), "limited": len(kept) != len(out)}


async def inventory(client):
    live = await client.rpc("session.list", scope="live", limit=200, _timeout=2)
    stored = await client.rpc("session.list", scope="stored", limit=200, _timeout=2)
    active = await client.rpc("session.active_list", _timeout=2)
    states = {r["id"]: r.get("status") for r in active.get("sessions", [])}
    rows = {}
    for scope, result in (("stored", stored), ("live", live)):
        for row in result.get("sessions", []):
            sid = row.get("session_id")
            if not isinstance(sid, str) or not sid or len(sid) > 256:
                continue
            if row.get("resolved_id", sid) != sid:
                continue  # Never follow a changing descendant implicitly.
            state = states.get(sid)
            rows[sid] = {**row, "scope": scope, "state":
                         "attention" if state == "waiting" else
                         "working" if state in ("working", "starting") else
                         "waiting" if state == "idle" or scope == "stored" else "unknown"}
    return rows, len(live.get("sessions", [])) == 200 or len(stored.get("sessions", [])) == 200


async def checked(client, endpoint, expected):
    rows, _ = await inventory(client)
    row = rows.get(expected.get("session"))
    if row is None or identity(endpoint, row) != expected:
        raise StaleTarget("session_changed")
    return row


def stored_history(home, row):
    from hermes_state import SessionDB
    db = SessionDB(db_path=home / "state.db", read_only=True)
    try:
        logical_id = row.get("id", row["session_id"])
        logical = db.get_session(logical_id)
        saved = db.get_session(row["session_id"])
        # The picker binds the root creation time to an explicitly resolved tip.
        # Validate that exact link; never substitute a newly compressed descendant.
        tip = db.get_compression_tip(logical_id) or logical_id
        if (not logical or not saved or tip != row["session_id"]
                or logical.get("started_at") != row.get("started_at")
                or logical.get("hidden") or logical.get("archived")
                or saved.get("source") != row.get("source")
                or saved.get("hidden") or saved.get("archived")):
            raise StaleTarget("stored_session_changed")
        # This is the gateway-authorized exact row. Ancestors are explicit lineage,
        # not a filename/time heuristic; no latest-descendant search is performed.
        history = db.get_messages_as_conversation(row["session_id"], include_ancestors=True)
        return stored_display(history, home)
    finally:
        db.close()


def stored_display(history, home):
    # Hermes owns compaction/steer/scaffold presentation. Its legacy sidecar
    # import redirects stdout; restore the helper's JSON channel even on failure.
    stdout, stderr = sys.stdout, sys.stderr
    try:
        sys.stdout = stderr
        from gateway.session_controls import display_projection
        return display_projection(history, home)
    finally:
        sys.stdout, sys.stderr = stdout, stderr


def orca_bindings(home, session_ids):
    """Read only the frozen pane/workspace identifiers, never environment secrets.

    Orca's installed Hermes hook records only a session ID, not a profile. The
    profile's own policy receipt supplies the missing side of the ownership join.
    """
    import sqlite3
    result = {}
    try:
        with closing(sqlite3.connect((home / "state.db").as_uri() + "?mode=ro", uri=True, timeout=0.2)) as db:
            for sid in session_ids:
                row = db.execute("""SELECT
                    json_extract(value, '$.policy.client_env_remote'),
                    COALESCE(json_extract(json_extract(value, '$.policy.client_env_json'), '$.ORCA_PANE_KEY'),
                             json_extract(json_extract(value, '$.policy.client_env_json'), '$.ORCA_AGENT_PANE')),
                    json_extract(json_extract(value, '$.policy.client_env_json'), '$.ORCA_WORKTREE_ID')
                    FROM state_meta WHERE key=?""", ("gateway.local_policy.v1:" + sid,)).fetchone()
                if row and row[0] == 0 and all(isinstance(v, str) and 0 < len(v) < 4096 for v in row[1:]):
                    result[sid] = {"paneKey": row[1], "worktreeId": row[2]}
    except (sqlite3.Error, OSError):
        pass  # Missing proof keeps the session in its explicit Hermes profile group.
    return result


async def operation(client, endpoint, home, request):
    expected = request["target"]
    row = await checked(client, endpoint, expected)
    action, sid = request["action"], expected["session"]
    if action == "activity":
        return {"state": row["state"], "elapsedSeconds": None}
    if action == "read":
        if row["scope"] == "live":
            raw = await client.rpc("session.history", session_id=sid, _timeout=5)
            messages = raw.get("messages", [])
        else:
            messages = await asyncio.to_thread(stored_history, home, row)
        await checked(client, endpoint, expected)
        return visible_messages(messages)
    if action != "send" or not isinstance(request.get("text"), str) or not request["text"].strip():
        raise ValueError("invalid_request")
    if len(request["text"]) > 16000 or not request.get("submissionId"):
        raise ValueError("invalid_request")
    # Only a confirmed user write reaches resume. It can refresh/adopt that exact
    # existing session, but cannot silently redirect to a compressed/new owner.
    mounted = await client.rpc("session.resume", session_id=sid, _timeout=8)
    if (mounted.get("session_id") != sid or mounted.get("authority_epoch") != expected["epoch"]
            or mounted.get("info", {}).get("profile_id", expected["profile"]) != expected["profile"]):
        raise StaleTarget("session_changed")
    if mounted.get("prompts"):
        raise StaleTarget("session_needs_attention")
    await checked(client, endpoint, expected)
    result = await client.rpc("prompt.submit", session_id=sid, text=request["text"],
                              submission_id=request["submissionId"], _timeout=8)
    ref = result.get("ref", {})
    if (ref.get("session_id") != sid or ref.get("profile_id") != expected["profile"]
            or result.get("authority_epoch") != expected["epoch"]
            or result.get("status") not in ("queued", "started", "terminal")):
        raise ValueError("delivery_uncertain")
    return {"accepted": True}


async def inspect_profile(name, home, request):
    from hermes_cli.gateway_runtime import discover_gateway_endpoint
    from hermes_cli.gateway_client import connect_gateway
    found = await asyncio.to_thread(discover_gateway_endpoint, home, timeout=0.5)
    if found.state != "ready" or found.endpoint is None:
        raise StaleTarget("gateway_unavailable")
    endpoint = found.endpoint
    if os.path.normcase(endpoint.profile_id) != os.path.normcase(str(home)):
        raise StaleTarget("profile_changed")
    # Sequential profiles: Hermes' home is process-local. Supplying an endpoint
    # forbids gateway startup, even if the owner vanishes before connection.
    os.environ["HERMES_HOME"] = str(home)
    async with connect_gateway(endpoint=endpoint) as client:
        described = await client.rpc("runtime.describe", _timeout=2)
        if any(described.get(key) != getattr(endpoint, key) for key in ("profile_id", "instance_id", "authority_epoch")):
            raise StaleTarget("owner_changed")
        if request["action"] != "list":
            return await operation(client, endpoint, home, request)
        rows, truncated = await inventory(client)
        bindings = await asyncio.to_thread(orca_bindings, home, rows)
        return {"sessions": [{"target": identity(endpoint, row), "profileName": name,
                              "title": row.get("title") or "Hermes conversation",
                              "state": row["state"], "scope": row["scope"],
                              "model": row.get("model") or "", "orca": bindings.get(row["session_id"])}
                             for row in rows.values()], "unavailableProfiles": int(truncated)}


async def main(request):
    root = Path(request["root"]).resolve()
    homes = [("default", root)]
    profiles = root / "profiles"
    if profiles.is_dir():
        homes += [(p.name, p.resolve()) for p in sorted(profiles.iterdir())
                  if p.is_dir() and not p.is_symlink() and (p / "state.db").is_file()]
    if request["action"] != "list":
        homes = [(name, home) for name, home in homes
                 if os.path.normcase(str(home)) == os.path.normcase(request["target"]["profile"])]
        if len(homes) != 1:
            raise StaleTarget("profile_changed")
        return await inspect_profile(*homes[0], request)
    output, unavailable = [], 0
    deadline = time.monotonic() + 10
    for name, home in homes[:32]:
        if time.monotonic() >= deadline:
            unavailable += 1
            continue
        try:
            result = await asyncio.wait_for(inspect_profile(name, home, request), timeout=max(0.1, min(3, deadline - time.monotonic())))
            output += result["sessions"]
            unavailable += result["unavailableProfiles"]
        except Exception:
            unavailable += 1
    return {"sessions": output, "unavailableProfiles": unavailable + max(0, len(homes) - 32)}


if __name__ == "__main__":
    try:
        install = Path(sys.argv[1]).resolve()
        sys.path.insert(0, str(install / "hermes-agent"))
        os.environ["HERMES_HOME"] = str(install)
        sys._hermes_pin_default_home = True
        import hermes_bootstrap  # reuse the installation's dependency bootstrap
        request = json.loads(sys.stdin.read(65536))
        # Keep operation failures bounded and never print installed-runtime diagnostics.
        result = asyncio.run(asyncio.wait_for(main(request), timeout=12 if request["action"] == "list" else 25))
        print(json.dumps({"ok": True, "result": result}, ensure_ascii=True))
    except Exception as exc:
        # Never return an exception string: it can contain chat, paths or credentials.
        reason = "stale_target" if isinstance(exc, StaleTarget) else "hermes_unavailable"
        if 'request' in globals() and request.get("action") == "send" and not isinstance(exc, StaleTarget):
            reason = "delivery_uncertain"
        print(json.dumps({"ok": False, "error": reason}))
