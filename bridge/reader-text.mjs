// Preserve role boundaries and hanging indentation without spacer rows between turns.
// Preserve explicit paragraph/code line breaks. Native text uses a proportional
// font, so a fixed character count wastes width and cannot predict visual wraps.
// Let the native container wrap each original line to its actual pixel width.
export function formatMessages(messages) {
  return messages.filter(m => ['user', 'assistant'].includes(m.role) && m.text.trim())
    .map(m => m.text.trim().split('\n').map((line, i) => `${i ? '  ' : m.role === 'user' ? '/ ' : '> '}${line}`).join('\n'))
    .join('\n');
}

// Compact model label for the one-row reader status, e.g. claude-opus-5-5 ->
// Opus5.5, gpt-6-astra + medium effort -> GPT-6-Astra med. Unknown -> ''.
const EFFORT = { minimal: 'min', low: 'low', medium: 'med', high: 'high', xhigh: 'xhigh' };
export function modelLabel(model, effort) {
  if (typeof model !== 'string' || !/^[\w.-]{1,64}$/.test(model)) return '';
  const claude = /^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?:-\d{8})?$/i.exec(model);
  if (claude) return claude[1][0].toUpperCase() + claude[1].slice(1).toLowerCase() + claude[2] + (claude[3] ? `.${claude[3]}` : '');
  const name = model.split('-').map(part => /^gpt$/i.test(part) ? 'GPT' : part.charAt(0).toUpperCase() + part.slice(1)).join('-');
  const level = typeof effort === 'string' ? EFFORT[effort] ?? '' : '';
  return level ? `${name} ${level}` : name;
}

// Codex prints 'GPT-6-Astra medium · <cwd> · <title>' in its footer. Read the
// model from the bottom rows only when no saved transcript supplies it.
export function terminalModel(lines) {
  for (const line of (lines || []).slice(-8).reverse()) {
    const match = /^\s*(gpt-[\w.-]+)\s+(minimal|low|medium|high|xhigh)\s+·\s/i.exec(line);
    if (match) return modelLabel(match[1].toLowerCase(), match[2].toLowerCase());
    // Cursor's agent CLI: 'Composer 2.5 Fast · 33.6% · 1 file edited'.
    const cursor = /^\s*([A-Z][\w.+-]*(?: [\w.+-]+){0,3}) · \d+(?:\.\d+)?%(?: ·|\s*$)/.exec(line);
    if (cursor && cursor[1].length <= 24) return cursor[1];
  }
  return '';
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

// Cursor's agent CLI indents replies by two spaces and everything else (tool
// summaries, command output, diffs) by four, under a two-space '$ command' or a
// four-space 'Read/Grepped/Edited ...' header. A four-space line continues a reply
// only directly after reply text (wrapped bullets). Footer: '→ Add a follow-up',
// the model/context line and the working directory. The screen does not mark the
// user's own messages, so every kept line is shown as the agent's.
const CURSOR_TOOL = /^(?:Read|Reading|Grepped|Grepping|Glob|Globbed|Listed|Searched|Edited|Editing|Wrote|Created|Deleted|Ran|Running|Fetched|Explored|Thought|Thinking|Updated|…|▎)/u;
export function cursorConversation(lines) {
  let end = lines.length;
  const follow = lines.findLastIndex(line => /^\s*→\s/.test(line));
  if (follow >= 0 && follow >= lines.length - 6) end = follow;
  const kept = [];
  let mode = 'none'; // 'reply' while reply text continues, 'tool' inside a tool block
  for (const raw of lines.slice(0, end)) {
    const indent = raw.length - raw.trimStart().length;
    const line = raw.trim();
    if (!line) { mode = mode === 'tool' ? 'tool' : 'none'; continue; }
    if (indent <= 3) {
      if (line.startsWith('$ ') || /^(?:Cursor Agent\b|v\d{4}\.|Tip:)/.test(line)) { mode = 'tool'; continue; }
      kept.push(line);
      mode = 'reply';
    } else if (mode === 'reply' && !CURSOR_TOOL.test(line)) {
      kept[kept.length - 1] += ' ' + line; // a wrapped reply line or bullet
    } else mode = 'tool';
  }
  return kept.length ? formatMessages([{ role: 'assistant', text: kept.join('\n') }]) : '';
}

export function terminalConversation(lines, provider) {
  if (provider === 'cursor') return cursorConversation(lines);
  if (provider === 'openclaude') provider = 'claude'; // Claude Code fork, same screen
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
