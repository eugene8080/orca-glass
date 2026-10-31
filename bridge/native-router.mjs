// Native Even AI supplies text; the selected Orca terminal remains the execution owner.
export function createNativeRouter(io) {
  let target = io.loadTarget?.() ?? null;
  let listed = [];
  let busy = false;
  let remaining = '';
  const recent = new Map();
  const now = io.now ?? Date.now;
  const sleep = io.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  const waitMs = io.waitMs ?? 8000;

  function display(text) {
    const plain = text.replace(/\r/g, '').trim();
    if (plain.length <= 350) { remaining = ''; return plain || 'No output yet.'; }
    const cut = Math.max(plain.lastIndexOf(' ', 290), 200);
    remaining = plain.slice(cut).trimStart();
    return `${plain.slice(0, cut)}\nSay read more to continue.`;
  }

  async function validTarget() {
    if (!target) throw new Error('Say list sessions, then select session and its number.');
    const current = await io.inspect(target.handle);
    if (current.agentIdentity !== 'codex' || !current.connected || current.orphaned || !current.writable || current.incarnationId !== target.incarnationId) {
      target = null;
      io.saveTarget?.(null);
      throw new Error('The selected terminal changed or disconnected. Say list sessions and select it again.');
    }
    return target;
  }

  function output(snapshot) {
    return snapshot.menu
      ? `Codex is asking: ${snapshot.menu.question}\n${snapshot.menu.options.map(o => `${o.value}: ${o.label}`).join('\n')}\nUse Orca Glass or the desktop to choose.`
      : snapshot.text;
  }

  return async function respond(text) {
    if (busy) return 'The previous voice request is still being handled. Please wait.';
    busy = true;
    try {
      const command = text.trim().replace(/[.!?]+$/, '').toLowerCase();
      if (/^(?:list (?:sessions|terminals)|sessions)$/.test(command)) {
        listed = await io.listThreads();
        return display(listed.length ? listed.map((t, i) => `${i + 1}. ${t.title} (${t.handle.slice(-6)})`).join('\n') + '\nSay select session and its number.' : 'No connected Codex terminals found.');
      }
      const selection = command.match(/^(?:select|switch to) (?:session|terminal) (\d+|one|two|three|four|five|six|seven|eight|nine|ten)$/);
      if (selection) {
        const words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
        const index = /^\d+$/.test(selection[1]) ? Number(selection[1]) - 1 : words.indexOf(selection[1]);
        const chosen = listed[index];
        if (!chosen) return 'Say list sessions first, then select one of the listed numbers.';
        const current = await io.inspect(chosen.handle);
        if (current.agentIdentity !== 'codex' || !current.connected || current.orphaned || !current.writable || !current.incarnationId) return 'That Codex terminal is unavailable. List sessions again.';
        target = { handle: chosen.handle, incarnationId: current.incarnationId, title: chosen.title };
        io.saveTarget?.(target);
        remaining = '';
        return display(`Selected ${target.title}. Ordinary spoken messages now go to this Codex terminal. Say read latest to check its output.`);
      }
      if (/^(?:read more|more)$/.test(command)) return display(remaining || 'No more text. Say read latest for current output.');
      if (/^(?:which session|current session)$/.test(command)) {
        const selected = await validTarget();
        return display(`Selected: ${selected.title} (${selected.handle.slice(-6)}).`);
      }
      const selected = await validTarget();
      if (/^(?:read latest|read response|latest response)$/.test(command)) return display(output(await io.readThread(selected.handle)));
      if (text.length > 2000) return 'Please keep each spoken message under 2000 characters.';

      // A network retry must not create a second agent turn. Reserve before sending,
      // retain uncertain outcomes, and suppress identical input for a short interval.
      const key = `${selected.incarnationId}:${text.trim()}`;
      for (const [k, value] of recent) if (now() - value.at > 30000) recent.delete(k);
      if (recent.has(key)) return recent.get(key).reply;
      const before = await io.readThread(selected.handle);
      if (before.menu) return display(output(before));
      if (before.inputReady !== true) return 'No current Codex input prompt is visible. Nothing sent. Check the desktop or select another session.';
      const entry = { at: now(), reply: 'Delivery is uncertain. Check the terminal or say read latest before trying again.' };
      recent.set(key, entry);
      try {
        const receipt = await io.sendToThread(selected.handle, text.trim(), true);
        if (receipt?.accepted === false || receipt?.receipt?.accepted === false) throw new Error('Input not accepted');
      }
      catch { return entry.reply; }
      entry.reply = `Sent to ${selected.title}. Codex is working; say read latest for its response.`;
      const deadline = now() + waitMs;
      while (now() < deadline) {
        await sleep(1000);
        const snapshot = await io.readThread(selected.handle).catch(() => null);
        if (snapshot && (snapshot.menu || (snapshot.text && snapshot.text !== before.text))) {
          entry.reply = display(`Latest from ${selected.title}:\n${output(snapshot)}`);
          break;
        }
      }
      return entry.reply;
    } catch (error) {
      return error.message || 'Could not reach the selected Codex terminal.';
    } finally { busy = false; }
  };
}
