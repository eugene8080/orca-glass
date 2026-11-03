// Preserve role boundaries and hanging indentation without spacer rows between turns.
function wrapLines(text) {
  const lines = [];
  for (let line of text.trim().split('\n')) {
    while ([...line].reduce((n, ch) => n + (/[ᄀ-￿]/.test(ch) ? 2 : 1), 0) > 50) {
      const chars = [...line];
      let columns = 0, end = 0;
      while (end < chars.length && columns + (/[ᄀ-￿]/.test(chars[end]) ? 2 : 1) <= 50) {
        columns += /[ᄀ-￿]/.test(chars[end]) ? 2 : 1;
        end++;
      }
      const space = chars.slice(0, end).lastIndexOf(' ');
      const cut = space > end / 2 ? space + 1 : end;
      lines.push(chars.slice(0, cut).join('').trimEnd());
      line = chars.slice(cut).join('');
    }
    lines.push(line);
  }
  return lines;
}

export function formatMessages(messages) {
  return messages.filter(m => ['user', 'assistant'].includes(m.role) && m.text.trim())
    .map(m => wrapLines(m.text).map((line, i) => `${i ? '  ' : m.role === 'user' ? '/ ' : '> '}${line}`).join('\n'))
    .join('\n');
}

const CODEX_TOOL = /^(?:Ran|Explored|Edited|Added|Deleted|Updated Plan|Called|Searched|Read|Listed|Waited|Worked|Working|Thinking|Reasoning|Model changed|You have|Context|Compact)\b/;
const CLAUDE_TOOL = /^(?:[A-Z][A-Za-z]*(?: [A-Z][A-Za-z]*)?\(|[\w.-]+ - [\w .-]+ \(MCP\)|Update Todos\b|Agent ".*" (?:finished|launched|failed|stopped))/;

export function terminalConversation(lines, provider) {
  const messages = [];
  let current = null;
  const user = provider === 'claude' ? '❯' : '›';
  const reply = provider === 'claude' ? '⏺' : '•';
  const tool = provider === 'claude' ? CLAUDE_TOOL : CODEX_TOOL;
  // Unknown terminal formats cannot safely distinguish tools from actual replies.
  if (!['codex', 'claude'].includes(provider)) return '';
  for (const raw of lines) {
    const line = raw.trim();
    if (line === user || line.startsWith(user + ' ')) {
      const text = line.slice(1).trim();
      current = text ? { role: 'user', text } : null;
      if (current) messages.push(current);
    } else if (line.startsWith(reply + ' ')) {
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
