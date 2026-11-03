// Preserve role boundaries and hanging indentation without spacer rows between turns.
// Preserve explicit paragraph/code line breaks. Native text uses a proportional
// font, so a fixed character count wastes width and cannot predict visual wraps.
// Let the native container wrap each original line to its actual pixel width.
export function formatMessages(messages) {
  return messages.filter(m => ['user', 'assistant'].includes(m.role) && m.text.trim())
    .map(m => m.text.trim().split('\n').map((line, i) => `${i ? '  ' : m.role === 'user' ? '/ ' : '> '}${line}`).join('\n'))
    .join('\n');
}

const CODEX_TOOL = /^(?:Ran|Explored|Edited|Added|Deleted|Updated Plan|Called|Searched|Read|Listed|Waited|Worked|Working|Thinking|Reasoning|Model changed|You have|Context|Compact|Exited \(status)\b/;
const CLAUDE_TOOL = /^(?:[A-Z][A-Za-z]*(?: [A-Z][A-Za-z]*)?\(|[\w.-]+ - [\w .-]+ \(MCP\)|Update Todos\b|Agent ".*" (?:finished|launched|failed|stopped))/;

// Terminal UI chrome is not conversation. Restrict recognition to the trailing
// composer/footer region, preserving genuine messages quoting these strings.
export function stripTerminalChrome(lines) {
  const start = Math.max(0, lines.length - 10);
  const hint = line => /^(?:← for agents\b|\? for shortcuts\b|[⏵▶►]+\s*(?:accept edits|bypass permissions)|(?:accept edits|bypass permissions) on\b)/i.test(line.trim());
  for (let i = lines.length - 1; i >= start; i--) {
    const line = lines[i].trim();
    const empty = /^[›❯]\s*$/.test(line) || (/^>\s*$/.test(line) && lines.slice(i + 1).some(hint));
    const placeholder = /^[›❯>]\s*(?:Ask (?:Codex|Claude|Cursor|Pi)\b|Try ["“]|Type (?:a |your )?(?:message|prompt)\b|Add a follow-up\b)/i.test(line);
    const tail = lines.slice(i + 1);
    if (empty || (placeholder && (tail.some(hint) || /^› Ask Codex to do anything$/.test(line)))) return lines.slice(0, i);
    if (hint(line)) {
      for (let p = i - 1; p >= Math.max(start, i - 5); p--) {
        if (/^[•⏺●]\s/.test(lines[p].trim())) break;
        if (/^[›❯>]\s/.test(lines[p].trim()) || /^[›❯>]$/.test(lines[p].trim())) return lines.slice(0, p);
      }
      // Some harnesses render the footer without a visible input marker.
      let cut = i;
      while (cut > start && /(?:[A-Z]:\\|~\/|\/(?:home|Users)\/|tokens?\s*[:·]|context\s*[:·])/i.test(lines[cut - 1])) cut--;
      return lines.slice(0, cut);
    }
  }
  return lines;
}

export function terminalConversation(lines, provider) {
  const messages = [];
  let current = null;
  const user = provider === 'claude' ? '❯' : '›';
  const replies = provider === 'claude' ? ['⏺', '●'] : ['•'];
  const tool = provider === 'claude' ? CLAUDE_TOOL : CODEX_TOOL;
  // Unknown terminal formats cannot safely distinguish tools from actual replies.
  if (!['codex', 'claude'].includes(provider)) return '';
  for (const raw of stripTerminalChrome(lines)) {
    const line = raw.trim();
    if (line === user || line.startsWith(user + ' ')) {
      const text = line.slice(1).trim();
      current = text ? { role: 'user', text } : null;
      if (current) messages.push(current);
    } else if (replies.some(reply => line.startsWith(reply + ' '))) {
      const text = line.slice(1).trim();
      current = tool.test(text) ? null : { role: 'assistant', text };
      if (current) messages.push(current);
    } else if (/^(?:[└⎿⚠■]|[✻✢✳✶✽∴◐◓◑◒⠁-⣿]\s|─{3,}|\+ Show details|↓ Back to bottom)/u.test(line)) {
      current = null;
    } else if (current) {
      current.text += '\n' + line;
    }
  }
  return formatMessages(messages);
}
