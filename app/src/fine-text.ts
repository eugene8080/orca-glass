// Small-text reader pages. The Even SDK has no font or size control for native
// text, so in small-text mode the whole screen (frame, chat, divider and status
// row) is drawn on the phone and sent as four greyscale image tiles: the SDK
// maximum of four images, each 288x144, together exactly the 576x288 canvas.
//
// Every font is a fixed cell of whole pixels, copied pixel-exact from a glyph
// table (app/src/fonts/glyphs.ts): no canvas text and no anti-aliasing.
// All monospace, each at its own native pixel grid (the G2 shows the 576x288
// canvas 1:1, confirmed with the display test pattern on 2026-11-09):
//   pixel:     Spleen 6x12 (bitmap)                          93 columns
//   pixel16:   Spleen 8x16 (bitmap)                          70 columns
//   mono:      JetBrains Mono 10px, FreeType mono, 6x14       93 columns
//   departure: Departure Mono at its 11px grid, 7x14         80 columns
//   monogram:  monogram (author's bitmap table), 6x12        93 columns
//   pixeloid:  Pixeloid Mono at its 9px grid, 6x11           93 columns
// Missing characters: box drawing as geometric lines and Braille as dots, both
// fitted to the cell; anything else via the WebView monospace font, thresholded
// to on/off pixels. East Asian wide characters take two cells.
import { SPLEEN_6X12, SPLEEN_8X16, JETBRAINS_MONO_10, DEPARTURE_MONO, MONOGRAM, PIXELOID_MONO } from './fonts/glyphs';

export type FineFont = 'pixel' | 'pixel16' | 'mono' | 'departure' | 'monogram' | 'pixeloid';
export const FINE_FONTS: FineFont[] = ['pixel', 'pixel16', 'mono', 'departure', 'monogram', 'pixeloid'];

const TABLES = { pixel: SPLEEN_6X12, pixel16: SPLEEN_8X16, mono: JETBRAINS_MONO_10, departure: DEPARTURE_MONO, monogram: MONOGRAM, pixeloid: PIXELOID_MONO };
export const SCREEN = { width: 576, height: 288 };
export const FINE_TILES = [0, 1, 2, 3].map(i => ({ xPosition: (i % 2) * 288, yPosition: Math.floor(i / 2) * 144, width: 288, height: 144 }));

// Layout in whole cells: a 2px frame, chat rows from y4, a 2px divider, then one
// status row at the bottom. Chat and status share the 560px text column at x8.
const TEXT_X = 8, TEXT_WIDTH = 560, TOP = 4, FRAME = 1;
export function fineLayout(font: FineFont) {
  const { width: cell, height: line } = TABLES[font];
  const statusY = SCREEN.height - FRAME - 2 - line;
  const dividerY = statusY - 3;
  const rows = Math.floor((dividerY - 2 - TOP) / line);
  return { cell, line, rows, columns: Math.floor(TEXT_WIDTH / cell), statusY, dividerY };
}

const parsed = new Map<FineFont, Map<number, number[]>>();
function glyph(font: FineFont, code: number): number[] | undefined {
  let table = parsed.get(font);
  if (!table) {
    table = new Map();
    for (const entry of TABLES[font].glyphs.split(';')) {
      const [hex, rows] = entry.split(':');
      table.set(parseInt(hex, 16), Array.from({ length: rows.length / 2 }, (_, i) => parseInt(rows.slice(i * 2, i * 2 + 2), 16)));
    }
    parsed.set(font, table);
  }
  return table.get(code);
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
export const FINE_TEXT_WIDTH = TEXT_WIDTH;

class Surface {
  readonly pixels = new Uint8ClampedArray(SCREEN.width * SCREEN.height);
  private canvas: CanvasRenderingContext2D | null = null;
  private canvasUsed = false;
  constructor(private font: FineFont) {}
  set(x: number, y: number) { if (x >= 0 && y >= 0 && x < SCREEN.width && y < SCREEN.height) this.pixels[y * SCREEN.width + x] = 255; }
  rect(x: number, y: number, w: number, h: number) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j); }
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
      if (bitmap) {
        for (let gy = 0; gy < bitmap.length; gy++) for (let gx = 0; gx < cw; gx++) if (bitmap[gy] & (0x80 >> gx)) this.set(px + gx, y + gy);
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
export function renderFineScreen(text: string, font: FineFont, status: { left: string; right: string }): number[][] {
  const s = new Surface(font);
  const { line, rows, columns, statusY, dividerY } = fineLayout(font);
  s.rect(0, 0, SCREEN.width, FRAME); s.rect(0, SCREEN.height - FRAME, SCREEN.width, FRAME);
  s.rect(0, 0, FRAME, SCREEN.height); s.rect(SCREEN.width - FRAME, 0, FRAME, SCREEN.height);
  text.split('\n').slice(0, rows).forEach((row, r) => s.text(row, TEXT_X, TOP + r * line, columns));
  s.rect(TEXT_X + 8, dividerY, TEXT_WIDTH - 16, 1);
  const rightCells = Math.min(fineCells(status.right), columns);
  s.text(status.right, TEXT_X + (columns - rightCells) * TABLES[font].width, statusY, rightCells);
  s.text(status.left, TEXT_X, statusY, Math.max(0, columns - rightCells - 1));
  return s.tiles();
}

// Display test: one-pixel gratings and a checkerboard. On a 1:1 display every
// line is equally sharp and evenly spaced; scaling to the 640x350 panel would
// make some lines thicker, fainter or unevenly spaced.
export function renderTestPattern(font: FineFont): number[][] {
  const s = new Surface(font);
  const { line } = fineLayout(font);
  s.rect(0, 0, SCREEN.width, 1); s.rect(0, SCREEN.height - 1, SCREEN.width, 1);
  s.rect(0, 0, 1, SCREEN.height); s.rect(SCREEN.width - 1, 0, 1, SCREEN.height);
  const label = (text: string, x: number, y: number) => s.text(text, x, y, Math.floor((568 - x) / TABLES[font].width));
  label('1:1 test. Every line should be equally sharp and evenly spaced.', 8, 4);
  const top = 8 + line;
  [1, 2, 3].forEach((gap, i) => {           // vertical lines: period 2, 3, 4 px
    const x0 = 8 + i * 140;
    label(`vertical ${gap + 1}px`, x0, top);
    for (let x = x0; x < x0 + 120; x += gap + 1) s.rect(x, top + line + 2, 1, 50);
  });
  const y1 = top + line + 60;
  [1, 2, 3].forEach((gap, i) => {           // horizontal lines
    const x0 = 8 + i * 140;
    label(`horizontal ${gap + 1}px`, x0, y1);
    for (let y = y1 + line + 2; y < y1 + line + 52; y += gap + 1) s.rect(x0, y, 120, 1);
  });
  // Checkerboards of 1, 2 and 3px squares. Blotches only in the 1px board point
  // to the pixels/optics; blotches in the same bands in all three to resampling.
  const checkTop = top + line + 2, checkBottom = y1 + line + 52, band = Math.floor((checkBottom - checkTop - 2 * line) / 3);
  [1, 2, 3].forEach((size, i) => {
    const y0 = checkTop + i * (band + line);
    label(`checker ${size}px`, 428, y0 - line - 1 + (i ? 0 : -1));
    for (let y = y0; y < y0 + band; y++) for (let x = 428; x < 568; x++)
      if ((Math.floor((x - 428) / size) + Math.floor((y - y0) / size)) % 2 === 0) s.set(x, y);
  });
  label('Swipe to return to the chat.', 8, SCREEN.height - 6 - line);
  return s.tiles();
}
