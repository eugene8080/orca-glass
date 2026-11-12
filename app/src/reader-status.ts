import { t } from './i18n';
export const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
export const WORKING_LABELS = ['Processing', 'Thinking', 'Pondering', 'Cooking', 'Computing', 'Inferring', 'Burning Tokens'];
// The rotating words in the current language (WORKING_LABELS is the English set).
export const workingLabels = (): string[] => t('workingWords').split('|');

export function readerStatus(state: string, frame = 0, elapsedMs = frame * 200): string {
  if (state === 'working') {
    const labels = workingLabels();
    const phase = Math.floor(elapsedMs / 5000) % labels.length;
    const dots = '.'.repeat(Math.floor((elapsedMs % 5000) / 500) % 3 + 1);
    return `${SPINNER[frame % SPINNER.length]} ${labels[phase]}${dots}`;
  }
  // Compact words for the one-row status: '/Waiting Opus5.5 [Tap&hold] Pg7/8'.
  return t(state === 'waiting' ? 'statusWaiting' : state === 'attention' ? 'statusAttention' : 'statusUnknown');
}

// Native/simulator fonts can omit Braille. Rasterize the exact Unicode pattern
// into a small Gray8 image, independent of the text renderer's glyph coverage.
export function statusPixels(symbol: string, on = 255): number[] {
  const pixels = Array(20 * 28).fill(0);
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= steps; i++) pixels[Math.round(y0 + (y1 - y0) * i / steps) * 20 + Math.round(x0 + (x1 - x0) * i / steps)] = on;
  };
  if (symbol === '+' || symbol === '*') {
    line(3, 14, 17, 14); line(10, 6, 10, 22);
    if (symbol === '*') { line(4, 8, 16, 20); line(4, 20, 16, 8); }
    return pixels;
  }
  if (symbol === '◇') {
    line(10, 3, 18, 14); line(18, 14, 10, 25); line(10, 25, 2, 14); line(2, 14, 10, 3);
    return pixels;
  }
  if (symbol === '?') {
    line(5, 7, 14, 7); line(14, 7, 14, 13); line(14, 13, 10, 17); line(10, 17, 10, 19);
    pixels[23 * 20 + 10] = on;
    return pixels;
  }
  if (symbol === '/') {
    for (let y = 3; y < 25; y++) {
      const x = Math.round(15 - (y - 3) * 10 / 21);
      for (let dx = -1; dx <= 1; dx++) pixels[y * 20 + x + dx] = on;
    }
    return pixels;
  }
  const bits = (symbol.codePointAt(0) || 0) - 0x2800;
  if (bits < 0 || bits > 255) return pixels;
  for (const [bit, cx, cy] of [[0, 5, 4], [1, 5, 11], [2, 5, 18], [6, 5, 25], [3, 15, 4], [4, 15, 11], [5, 15, 18], [7, 15, 25]]) {
    if (!(bits & (1 << bit))) continue;
    for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= 4) pixels[y * 20 + x] = on;
    }
  }
  return pixels;
}
