// Small-text reader pages. The Even SDK has no font or size control for native
// text, so in small-text mode the whole screen (frame, chat, divider and status
// row) is drawn on the phone and sent as four greyscale image tiles: the SDK
// maximum of four images, each 288x144, together exactly the 576x288 canvas.
//
// Every font is a fixed cell of whole pixels, copied pixel-exact from a glyph
// table (app/src/fonts/glyphs.ts): no canvas text and no anti-aliasing.
// All monospace, each at its own native pixel grid (the G2 shows the 576x288
// canvas 1:1, confirmed with the display test pattern on 2026-11-09):
// cell sizes below; a page is as many whole cells as fit inside the 1px frame.
// Bitmap fonts come from their BDF files, outline pixel fonts are rasterised at their own pixel grid,
// JetBrains Mono by FreeType in monochrome mode (see scripts/build-fine-fonts.py).
// Missing characters: box drawing as geometric lines and Braille as dots, both
// fitted to the cell; anything else via the WebView monospace font, thresholded
// to on/off pixels. East Asian wide characters take two cells.
import { getLang, t } from './i18n';
import { DEPARTURE_MONO, DEPARTURE_MONO_11, TERMINUS, GOHU, SCIENTIFICA, FIXED, FIXED_8, FIXED_9, FIXED_10, SHINONOME, SHINONOME_K12 } from './fonts/glyphs';

// Menu order: narrowest cell first, then by height. (2026-11-10: Spleen, Monogram,
// Cozette, Pixeloid Mono and JetBrains Mono removed at the user's request.)
const TABLES = {
  scientifica: SCIENTIFICA, gohu: GOHU, terminus: TERMINUS, shinonome: SHINONOME, fixed: FIXED,
  departure11: DEPARTURE_MONO_11, departure: DEPARTURE_MONO,
  fixed8: FIXED_8, fixed9: FIXED_9, fixed10: FIXED_10,
};
export type FineFont = keyof typeof TABLES;
export const FINE_FONTS = Object.keys(TABLES) as FineFont[];
const NAMES: Record<FineFont, string> = {
  scientifica: 'Scientifica', gohu: 'GohuFont', terminus: 'Terminus', shinonome: 'Shinonome', fixed: 'Misc Fixed',
  departure11: 'Departure', departure: 'Departure',
  fixed8: 'Misc Fixed', fixed9: 'Misc Fixed', fixed10: 'Misc Fixed',
};
// 'Cozette 6x13': short name and native cell. The glasses menu truncates labels
// beyond about 210px, so names are short (Pixeloid Mono -> Pixeloid).
export const fineLabel = (font: FineFont) => `${NAMES[font]} ${TABLES[font].width}x${TABLES[font].height}`;
export const SCREEN = { width: 576, height: 288 };
export const FINE_TILES = [0, 1, 2, 3].map(i => ({ xPosition: (i % 2) * 288, yPosition: Math.floor(i / 2) * 144, width: 288, height: 144 }));

// Layout in whole cells: a 1px frame, chat rows from y4, a divider, then one
// status row at the bottom. Chat and status share every whole cell that fits
// inside the frame (574px). A 7px cell fills it exactly (82 columns); 5px and
// 6px cells leave less than one cell, centred.
const TOP = 4, FRAME = 1;
const INNER = SCREEN.width - 2 * FRAME;
export function fineLayout(font: FineFont) {
  const { width: cell, height: line } = TABLES[font];
  const statusY = SCREEN.height - FRAME - 2 - line;
  const dividerY = statusY - 3;
  const rows = Math.floor((dividerY - 2 - TOP) / line);
  const columns = Math.floor(INNER / cell);
  const textWidth = columns * cell;
  const textX = FRAME + Math.floor((INNER - textWidth) / 2);
  return { cell, line, rows, columns, textWidth, textX, statusY, dividerY };
}

const parsed = new Map<FineFont, Map<number, number[]>>();
function glyph(font: FineFont, code: number): number[] | undefined {
  let table = parsed.get(font);
  if (!table) {
    table = new Map();
    const digits = TABLES[font].width > 8 ? 4 : 2;
    for (const entry of TABLES[font].glyphs.split(';')) {
      const [hex, rows] = entry.split(':');
      table.set(parseInt(hex, 16), Array.from({ length: rows.length / digits }, (_, i) => parseInt(rows.slice(i * digits, i * digits + digits), 16)));
    }
    parsed.set(font, table);
  }
  return table.get(code);
}

// Japanese (2026-11-10): one 12x12 wide table (Shinonome, JIS level 1 kanji, kana,
// symbols) shared by every small font. Rows are 16-bit, bit 15 = leftmost pixel; the
// glyphs use 11 columns. It fits the 6x12, 6x13 and 7x14 cells exactly; in 11-row
// fonts it overflows one row upwards, in Scientifica (10px two-cell) one column right.
const WIDE = SHINONOME_K12;
let wideParsed: Map<number, number[]> | null = null;
function wideGlyph(code: number): number[] | undefined {
  if (!wideParsed) {
    wideParsed = new Map();
    for (const entry of WIDE.glyphs.split(';')) {
      const [hex, rows] = entry.split(':');
      wideParsed.set(parseInt(hex, 16), Array.from({ length: rows.length / 4 }, (_, i) => parseInt(rows.slice(i * 4, i * 4 + 4), 16)));
    }
  }
  return wideParsed.get(code);
}

// Two cells for East Asian wide/fullwidth characters and emoji; zero for
// combining marks and joiners; one otherwise.
// Light, heavy, double and rounded box drawing share one single-pixel line style.
const BOX: Record<string, string> = {};
for (const [chars, arms] of [
  ['─━═╌╍┄┅┈┉', 'lr'], ['│┃║╎╏┆┇┊┋', 'ud'], ['┌┏╔╭┍┎╒╓', 'dr'], ['┐┓╗╮┑┒╕╖', 'dl'], ['└┗╚╰┕┖╘╙', 'ur'], ['┘┛╝╯┙┚╛╜', 'ul'],
  ['├┣╠┝┞┟┠┡┢╞╟', 'udr'], ['┤┫╣┥┦┧┨┩┪╡╢', 'udl'], ['┬┳╦┭┮┯┰┱┲╤╥', 'dlr'], ['┴┻╩┵┶┷┸┹┺╧╨', 'ulr'],
  ['┼╋╬┽┾┿╀╁╂╃╄╅╆╇╈╉╊╪╫', 'udlr'], ['╴', 'l'], ['╶', 'r'], ['╵', 'u'], ['╷', 'd'], ['▶►', 'lr>'],
] as const) for (const c of chars) BOX[c] = arms;

export function cellWidth(ch: string): number {
  const c = ch.codePointAt(0) || 0;
  if (/\p{Mn}|\p{Me}|‍|️/u.test(ch)) return 0;
  if ((c >= 0x1100 && c <= 0x115f) || (c >= 0x2e80 && c <= 0xa4cf) || (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) || (c >= 0xfe30 && c <= 0xfe4f) || (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6) || (c >= 0x1f300 && c <= 0x1faff) || (c >= 0x20000 && c <= 0x3fffd)) return 2;
  return 1;
}
export const fineCells = (text: string) => { let n = 0; for (const ch of text) n += cellWidth(ch); return n; };
// Width in pixels for the reader's word wrap (readerPages measures in pixels).
export const fineMeasure = (font: FineFont) => (text: string) => fineCells(text) * TABLES[font].width;

class Surface {
  readonly pixels = new Uint8ClampedArray(SCREEN.width * SCREEN.height);
  private canvas: CanvasRenderingContext2D | null = null;
  private canvasUsed = false;
  // font is switchable so one screen can compare several fonts.
  constructor(public font: FineFont) {}
  set(x: number, y: number, level = 255) { if (x >= 0 && y >= 0 && x < SCREEN.width && y < SCREEN.height) this.pixels[y * SCREEN.width + x] = level; }
  rect(x: number, y: number, w: number, h: number, level = 255) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, level); }
  // Draw text from (x, y) in whole cells; stops at maxCells. Returns cells used.
  text(text: string, x: number, y: number, maxCells: number): number {
    const { width: cw, height: ch } = TABLES[this.font];
    let col = 0;
    for (const c of text) {
      const cells = cellWidth(c);
      if (cells === 0) continue;
      if (col + cells > maxCells) break;
      const px = x + col * cw, code = c.codePointAt(0) || 0;
      const bitmap = glyph(this.font, code);
      const wide = !bitmap && cells === 2 ? wideGlyph(code) : undefined;
      if (bitmap) {
        const high = cw > 8 ? 0x8000 : 0x80;
        for (let gy = 0; gy < bitmap.length; gy++) for (let gx = 0; gx < cw; gx++) if (bitmap[gy] & (high >> gx)) this.set(px + gx, y + gy);
      } else if (wide) {
        // Baseline-aligned to this font; centred in the two-cell box (11 used columns).
        const dy = TABLES[this.font].ascent - WIDE.ascent, dx = Math.max(0, (2 * cw - 11) >> 1);
        for (let gy = 0; gy < wide.length; gy++) for (let gx = 0; gx < 16; gx++) if (wide[gy] & (0x8000 >> gx)) this.set(px + dx + gx, y + dy + gy);
      } else if (BOX[c]) {
        this.box(BOX[c], px, y, cw, ch);
      } else if (code >= 0x2800 && code <= 0x28ff) {
        this.braille(code - 0x2800, px, y, cw, ch);
      } else if (c.trim()) {
        const ctx = this.ctx();
        ctx.font = `${ch - 2}px monospace`;
        ctx.fillText(c, px, y + ch - Math.ceil(ch / 5), cells * cw);
        this.canvasUsed = true;
      }
      col += cells;
    }
    return col;
  }
  // Box drawing from the cell centre to its edges: 'udlr' = up, down, left, right.
  private box(arms: string, x: number, y: number, cw: number, ch: number) {
    const cx = x + Math.floor((cw - 1) / 2), cy = y + Math.floor((ch - 1) / 2);
    if (arms.includes('u')) this.rect(cx, y, 1, cy - y + 1);
    if (arms.includes('d')) this.rect(cx, cy, 1, y + ch - cy);
    if (arms.includes('l')) this.rect(x, cy, cx - x + 1, 1);
    if (arms.includes('r')) this.rect(cx, cy, x + cw - cx, 1);
    if (arms.includes('>')) for (let i = 0; i < 3; i++) this.rect(x + cw - 2 - i, cy - i, 1, 2 * i + 1);
  }
  // Braille cells as 2x4 single-pixel dots centred in the cell (dot numbering 1-8).
  private braille(bits: number, x: number, y: number, cw: number, ch: number) {
    const dx = [Math.floor(cw / 2) - 2, Math.floor(cw / 2) + 1];
    const step = Math.max(2, Math.floor((ch - 2) / 4));
    const top = y + Math.floor((ch - step * 3 - 1) / 2);
    [[0, 0, 0], [1, 0, 1], [2, 0, 2], [3, 1, 0], [4, 1, 1], [5, 1, 2], [6, 0, 3], [7, 1, 3]].forEach(([bit, col, row]) => {
      if (bits & (1 << bit)) this.set(x + dx[col], top + row * step);
    });
  }
  private ctx() {
    if (this.canvas) return this.canvas;
    const c = document.createElement('canvas');
    c.width = SCREEN.width; c.height = SCREEN.height;
    this.canvas = c.getContext('2d', { willReadFrequently: true })!;
    this.canvas.fillStyle = '#000'; this.canvas.fillRect(0, 0, SCREEN.width, SCREEN.height);
    this.canvas.fillStyle = '#fff'; this.canvas.textBaseline = 'alphabetic';
    return this.canvas;
  }
  tiles(): number[][] {
    if (this.canvasUsed) {
      // Fallback glyphs only: on/off at half coverage, like every other pixel here.
      const data = this.ctx().getImageData(0, 0, SCREEN.width, SCREEN.height).data;
      for (let i = 0; i < this.pixels.length; i++) if (data[i * 4] >= 128) this.pixels[i] = 255;
    }
    return FINE_TILES.map(tile => {
      const out = new Array<number>(tile.width * tile.height);
      for (let y = 0; y < tile.height; y++) for (let x = 0; x < tile.width; x++)
        out[y * tile.width + x] = this.pixels[(tile.yPosition + y) * SCREEN.width + tile.xPosition + x];
      return out;
    });
  }
}

// One full screen: frame, chat rows (already wrapped to fineLayout().columns),
// divider and the status row (left text, right text right-aligned).
// Thinking indicator for tile modes (native text keeps the Braille spinner): a
// scanner light sweeping across SCANNER_SEGMENTS segments and back, with a tail in
// three dimmer greys. One step per frame; a full sweep there and back is 14 frames.
export const SCANNER_SEGMENTS = 8;
const SCANNER_SEGMENT = 5, SCANNER_GAP = 1, SCANNER_LEVELS = [255, 176, 112, 64];
export const SCANNER_WIDTH = SCANNER_SEGMENTS * (SCANNER_SEGMENT + SCANNER_GAP) - SCANNER_GAP;
export function scannerLevels(frame: number): number[] {
  const period = 2 * (SCANNER_SEGMENTS - 1);
  const step = ((frame % period) + period) % period;
  const forward = step < SCANNER_SEGMENTS - 1 || step === period;
  const head = step < SCANNER_SEGMENTS ? step : period - step;
  // The tail trails behind the direction of travel.
  return Array.from({ length: SCANNER_SEGMENTS }, (_, i) => {
    const behind = forward ? head - i : i - head;
    return behind >= 0 && behind < SCANNER_LEVELS.length ? SCANNER_LEVELS[behind] : 0;
  });
}

export type FineStatus = { left: string; right: string; model?: string; scanner?: number };
export function renderFineScreen(text: string, font: FineFont, status: FineStatus): number[][] {
  const s = new Surface(font);
  const { line, rows, columns, textX, textWidth, statusY, dividerY } = fineLayout(font);
  s.rect(0, 0, SCREEN.width, FRAME); s.rect(0, SCREEN.height - FRAME, SCREEN.width, FRAME);
  s.rect(0, 0, FRAME, SCREEN.height); s.rect(SCREEN.width - FRAME, 0, FRAME, SCREEN.height);
  text.split('\n').slice(0, rows).forEach((row, r) => s.text(row, textX, TOP + r * line, columns));
  s.rect(textX, dividerY, textWidth, 1);
  const rightCells = Math.min(fineCells(status.right), columns);
  s.text(status.right, textX + (columns - rightCells) * TABLES[font].width, statusY, rightCells);
  const leftCells = Math.max(0, columns - rightCells - 1);
  if (status.scanner === undefined) s.text(status.left, textX, statusY, leftCells);
  else {
    // 'Opus5.5 [scanner] Thinking...': the model stays put, the light sweeps.
    const cw = TABLES[font].width;
    const modelCells = status.model ? s.text(`${status.model} `, textX, statusY, leftCells) : 0;
    const x0 = textX + modelCells * cw, barCells = Math.ceil(SCANNER_WIDTH / cw) + 1;
    const h = Math.max(3, Math.floor(line / 3)), y0 = statusY + Math.floor((line - h) / 2);
    scannerLevels(status.scanner).forEach((level, i) => { if (level) s.rect(x0 + i * (SCANNER_SEGMENT + SCANNER_GAP), y0, SCANNER_SEGMENT, h, level); });
    s.text(status.left, x0 + barCells * cw, statusY, Math.max(0, leftCells - modelCells - barCells));
  }
  return s.tiles();
}

// Font comparison: every small font on one screen, one line each (ten fonts no
// longer fit a second alphabet line), drawn in that font: its name and cell, a
// sample sentence, look-alike characters, brackets and operators, box drawing
// and a Braille spinner frame.
export const FONT_SAMPLE = 'Quick brown fox 0O1lI| {}[] -> != ─┼─ ⠋';
export const FONT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789';
// Japanese mode shows kana, kanji and full-width punctuation on the second line instead.
export const FONT_SAMPLE_JA = 'あいうえお アイウエオ 日本語の表示、漢字。「東雲」 ABC abc 0123';
export function renderFontComparison(): number[][] {
  const s = new Surface(FINE_FONTS[0]);
  s.rect(0, 0, SCREEN.width, FRAME); s.rect(0, SCREEN.height - FRAME, SCREEN.width, FRAME);
  s.rect(0, 0, FRAME, SCREEN.height); s.rect(SCREEN.width - FRAME, 0, FRAME, SCREEN.height);
  const nameCells = Math.max(...FINE_FONTS.map(font => fineLabel(font).length)) + 2;
  let y = TOP;
  for (const font of FINE_FONTS) {
    s.font = font;
    const layout = fineLayout(font);
    const sample = getLang() === 'ja' ? FONT_SAMPLE_JA : FONT_SAMPLE;
    s.text(`${fineLabel(font).padEnd(nameCells)}${sample}`, layout.textX, y, layout.columns);
    y += TABLES[font].height + 2;
  }
  s.font = FINE_FONTS[0];
  const back = fineLayout(s.font);
  s.rect(back.textX, y + 2, back.textWidth, 1);
  s.text(t('compareBack'), back.textX, y + 8, back.columns);
  return s.tiles();
}

// Markdown tables in replies are padded so their columns line up in the
// monospace small-text fonts (native text is proportional and cannot align).
// A table is a run of '| ... |' rows whose second row is the '|---|:--:|' rule;
// that rule's colons set each column's alignment. Role prefixes ('> ', '/ ',
// two-space continuation) are kept. Anything else passes through unchanged.
export function alignMarkdownTables(text: string): string {
  const lines = text.split('\n');
  const prefix = (line: string) => /^(?:[/>] | {2})/.exec(line)?.[0] ?? '';
  const body = (line: string) => line.slice(prefix(line).length).trim();
  const isRow = (line: string) => /^\|.*\|$/.test(body(line));
  const out: string[] = [];
  for (let i = 0; i < lines.length;) {
    if (!isRow(lines[i])) { out.push(lines[i++]); continue; }
    let j = i;
    while (j < lines.length && isRow(lines[j])) j++;
    const block = lines.slice(i, j);
    const cells = block.map(line => body(line).slice(1, -1).split('|').map(cell => cell.trim()));
    if (block.length < 2 || !cells[1].every(cell => /^:?-+:?$/.test(cell))) { out.push(...block); i = j; continue; }
    const count = Math.max(...cells.map(row => row.length));
    const align = Array.from({ length: count }, (_, c) => {
      const rule = cells[1][c] ?? '';
      return rule.endsWith(':') ? (rule.startsWith(':') ? 'center' : 'right') : 'left';
    });
    const widths = Array.from({ length: count }, (_, c) =>
      Math.max(3, ...cells.filter((_, r) => r !== 1).map(row => fineCells(row[c] ?? ''))));
    const pad = (cell: string, width: number, how: string) => {
      const gap = width - fineCells(cell);
      return how === 'right' ? ' '.repeat(gap) + cell : how === 'center'
        ? ' '.repeat(gap >> 1) + cell + ' '.repeat(gap - (gap >> 1)) : cell + ' '.repeat(gap);
    };
    block.forEach((line, r) => {
      const row = r === 1 ? widths.map(w => '-'.repeat(w)) : widths.map((w, c) => pad(cells[r][c] ?? '', w, align[c]));
      out.push(`${prefix(line)}| ${row.join(' | ')} |`);
    });
    i = j;
  }
  return out.join('\n');
}
