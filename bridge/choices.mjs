import { createHash } from 'node:crypto';

// Only interactive, cursor-marked menus qualify. Ordinary numbered prose must
// never become an approval button. Unknown layouts remain text-only.
export function parseChoices(lines) {
  const selected = lines.findLastIndex((line) => /^\s*[›❯]\s*\d+[.)]\s+\S/.test(line));
  if (selected < 0) return null;
  const pattern = /^\s*(?:[›❯]\s*)?(\d+)[.)]\s+(.+?)\s*$/;
  // Claude's AskUserQuestion has wrapped descriptions and a separate final
  // "Chat about this" row. Its native footer proves these are interactive rows.
  const footer = lines.findIndex((line, i) => i > selected && /Enter to select.*Esc to cancel/i.test(line));
  let start = selected;
  while (start > 0 && pattern.test(lines[start - 1])) start--;
  if (footer >= 0) {
    for (let i = selected; i >= 0; i--) {
      if (pattern.exec(lines[i])?.[1] === '1') { start = i; break; }
      if (i < selected && lines[i].trim() && !/^\s/.test(lines[i]) && !/^─{3,}/.test(lines[i]) && !pattern.test(lines[i])) break;
    }
  }
  let end = selected + 1;
  while (end < lines.length && pattern.test(lines[end])) end++;
  if (footer >= 0) end = footer;
  // Claude echoes a sent message with the same ❯ marker (Codex: ›), so a typed
  // "❯ 1) … / 2) …" list looks like a cursor menu. A live menu is the bottom UI:
  // a later reply (●/⏺), another prompt row or the input-box footer means these
  // rows are sent history or an unsent draft, never choices.
  if (lines.slice(end).some(l => /^\s*(?:[●⏺]|[›❯])|⏵⏵|\? for shortcuts|shift\+tab to cycle/i.test(l))) return null;
  const options = [];
  for (const line of lines.slice(start, end)) {
    const match = line.match(pattern);
    if (match) options.push({ value: match[1], label: match[2] });
    else if (footer >= 0 && line.trim() && !/^\s*─{3,}/.test(line)) {
      // Only indented continuation text belongs to an option. Unexpected rows
      // invalidate the layout instead of becoming an accidental approval.
      if (!options.length || !/^\s+\S/.test(line)) return null;
      options.at(-1).description = [options.at(-1).description, line.trim()].filter(Boolean).join(' ');
    }
  }
  if (options.length < 2 || options.length > 9 || options.some((o, i) => Number(o.value) !== i + 1)) return null;
  // Include the screen context to invalidate an old selection even if the next
  // question reuses exactly the same option labels. Ignore cursor movement.
  let questionLines = lines.slice(0, start);
  const divider = questionLines.findLastIndex(line => /^\s*─{3,}/.test(line));
  if (divider >= 0) questionLines = questionLines.slice(divider + 1);
  questionLines = questionLines.map(line => line.replace(/^\s*[│|]\s?/, '').trim());
  const question = questionLines.slice(-8).join('\n').trim();
  const context = JSON.stringify({ question: questionLines.join('\n'), options });
  const id = createHash('sha256').update(context).digest('hex');
  return { id, options, question };
}

export function validateChoice(menu, id, value) {
  if (!menu || menu.id !== id) throw new Error('Question changed. Reopen the thread before choosing.');
  if (!menu.options.some((option) => option.value === value)) throw new Error('Unknown choice');
  return value;
}
