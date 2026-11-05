// グラスの表示上限はバイト数で決まる(リスト項目 63B / テキスト 999B)。日本語は1文字3バイト。
const enc = new TextEncoder();

// Match a reviewed spoken number only, never infer approval from a sentence
// that happens to contain one. The server still revalidates the captured menu.
export function choiceNumber(text: string): string | null {
  const value = text.trim().toLowerCase().replace(/[.!?,]+$/g, '').replace(/^(?:option|number|choose|select)\s+/, '');
  const words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  if (/^[1-9]$/.test(value)) return value;
  const index = words.indexOf(value);
  return index >= 0 ? String(index + 1) : null;
}

export function readerContent(text: string, menu?: { question: string; options: { value: string; label: string }[] } | null, progress = '', working = false): string {
  if (menu) return [text.trim(), menu.question, ...menu.options.map(o => `${o.value}. ${o.label}`), 'Click for choices. Hold to speak a number.'].filter(Boolean).join('\n');
  return [text.trim(), working ? `~ ${progress || 'Working…'}` : ''].filter(Boolean).join('\n');
}

export function clipBytes(s: string, max: number): string {
  if (enc.encode(s).length <= max) return s;
  let out = '';
  for (const ch of s) {
    if (enc.encode(out + ch + '…').length > max) break;
    out += ch;
  }
  return out + '…';
}

// 末尾を残して先頭を落とす(ターミナルは最新が下にあるため)
export function tailBytes(s: string, max: number): string {
  if (enc.encode(s).length <= max) return s;
  const chars = [...s];
  let out = '';
  for (let i = chars.length - 1; i >= 0; i--) {
    if (enc.encode(chars[i] + out).length > max - 3) break;
    out = chars[i] + out;
  }
  return '…' + out;
}

// 表示行数で末尾を切る。1行 = 半角約56字(全角約28字)。折り返しを見積もって最新 maxRows 行分だけ残す
const COLS = 54;
const width = (s: string) => [...s].reduce((n, c) => n + (/[ᄀ-￿]/.test(c) ? 2 : 1), 0);

// Keep every character while fitting both display rows and the SDK byte budget.
export function textPages(text: string, maxRows = 8, maxBytes = 999): string[] {
  const rows: string[] = [];
  for (const line of text.split('\n')) {
    let row = '', columns = 0;
    for (const ch of line) {
      const w = width(ch);
      if (columns + w > COLS) { rows.push(row); row = ''; columns = 0; }
      row += ch;
      columns += w;
    }
    rows.push(row);
  }
  const pages: string[] = [];
  let page: string[] = [];
  for (const row of rows) {
    if (page.length && (page.length >= maxRows || enc.encode([...page, row].join('\n')).length > maxBytes)) {
      pages.push(page.join('\n')); page = [];
    }
    page.push(row);
  }
  if (page.length) pages.push(page.join('\n'));
  return pages.length ? pages : [''];
}

export function textLines(text: string): string[] {
  return textPages(text, 1, 999);
}

export function lastLineOffset(text: string, rows = 8): number {
  return Math.max(0, textLines(text).length - rows);
}

export function textWindow(text: string, offset: number, rows = 8, bytes = 999): string {
  const lines = textLines(text).slice(offset, offset + rows);
  while (lines.length > 1 && enc.encode(lines.join('\n')).length > bytes) lines.pop();
  return lines.join('\n');
}

export function tailRows(s: string, maxRows: number): string {
  const out: string[] = [];
  let rows = 0;
  for (const line of s.split('\n').reverse()) {
    const r = Math.max(1, Math.ceil(width(line) / COLS));
    if (rows + r > maxRows) {
      const room = maxRows - rows;
      if (room > 0) out.unshift('…' + [...line].slice(-Math.floor((room * COLS) / 2)).join(''));
      break;
    }
    out.unshift(line);
    rows += r;
  }
  return out.join('\n');
}

// G2 rejected the 2,000-byte upload on hardware. Retain the working 900-byte
// budget until a larger native update is verified on this device.
// Fill from the end so the latest block is full, not a tiny remainder. Preserve
// every character and let firmware wrap/scroll the intact block.
export function textSections(text: string, limit = 900): string[] {
  if (!Number.isInteger(limit) || limit < 4) throw new Error('Invalid text section limit');
  const sections: string[] = [];
  let section = '', bytes = 0;
  const chars = [...text];
  for (let i = chars.length - 1; i >= 0; i--) {
    const ch = chars[i];
    const size = enc.encode(ch).length;
    if (bytes + size > limit) { sections.push(section); section = ''; bytes = 0; }
    section = ch + section;
    bytes += size;
  }
  sections.push(section);
  return sections.reverse();
}

// Explicit six-row pages fit above the voice panel. Keep every source character
// and the hardware-proven byte budget; page boundaries never slice list numbers.
export function readerPages(text: string, measure: (text: string) => number, width = 550, rowsPerPage = 6, byteLimit = 900): string[] {
  const rows: string[] = [];
  for (const line of text.split('\n')) {
    if (!line) { rows.push(''); continue; }
    let row = '';
    for (const token of line.match(/\s+|\S+/gu) || []) {
      if (measure(row + token) <= width && enc.encode(row + token).length <= byteLimit) { row += token; continue; }
      if (row) { rows.push(row); row = ''; }
      for (const ch of token) {
        if (row && (measure(row + ch) > width || enc.encode(row + ch).length > byteLimit)) {
          rows.push(row); row = '';
        }
        row += ch;
      }
    }
    rows.push(row);
  }
  const pages: string[] = [];
  let page: string[] = [];
  for (const row of rows) {
    if (page.length && (page.length === rowsPerPage || enc.encode([...page, row].join('\n')).length > byteLimit)) {
      pages.push(page.join('\n')); page = [];
    }
    page.push(row);
  }
  if (page.length) pages.push(page.join('\n'));
  return pages.length ? pages : [''];
}
