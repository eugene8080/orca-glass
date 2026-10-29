import { createHash } from 'node:crypto';

// Only interactive, cursor-marked menus qualify. Ordinary numbered prose must
// never become an approval button. Unknown layouts remain text-only.
export function parseChoices(lines) {
  const selected = lines.findLastIndex((line) => /^\s*[›❯]\s*\d+[.)]\s+\S/.test(line));
  if (selected < 0) return null;
  const pattern = /^\s*(?:[›❯]\s*)?(\d+)[.)]\s+(.+?)\s*$/;
  let start = selected;
  while (start > 0 && pattern.test(lines[start - 1])) start--;
  let end = selected + 1;
  while (end < lines.length && pattern.test(lines[end])) end++;
  const options = lines.slice(start, end).map((line) => {
    const match = line.match(pattern);
    return { value: match[1], label: match[2] };
  });
  if (options.length < 2 || options.length > 9 || options.some((o, i) => Number(o.value) !== i + 1)) return null;
  // Include the screen context to invalidate an old selection even if the next
  // question reuses exactly the same option labels. Ignore cursor movement.
  const context = lines.map((line) => line.replace(/^(\s*)[›❯](\s*\d+[.)])/, '$1 $2').trimEnd()).join('\n');
  const id = createHash('sha256').update(context).digest('hex');
  return { id, options, question: lines.slice(Math.max(0, start - 8), start).join('\n').trim() };
}

export function validateChoice(menu, id, value) {
  if (!menu || menu.id !== id) throw new Error('Question changed. Reopen the thread before choosing.');
  if (!menu.options.some((option) => option.value === value)) throw new Error('Unknown choice');
  return value;
}
