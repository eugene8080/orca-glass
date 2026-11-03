import { SPINNER, statusPixels } from './reader-status';
declare const __APP_VERSION__: string;

export type SessionRow = { left: string; right?: string; state?: string; handle?: string };
export type SessionListView = { count: number; rows: SessionRow[]; selected: number; frame: number };
export const SESSION_TILES = Array.from({ length: 4 }, (_, i) => ({
  containerID: 20 + i, containerName: `sessions-${i}`,
  xPosition: (i % 2) * 288, yPosition: Math.floor(i / 2) * 144, width: 288, height: 144,
}));
export const agentLabel = (id: string) => ({ codex: 'Codex', claude: 'Claude', pi: 'Pi', cursor: 'Cursor', opencode: 'OpenCode', gemini: 'Gemini' }[id] || id);

export function drawSessionList(view: SessionListView): number[][] {
  const canvas = document.createElement('canvas');
  canvas.width = 576; canvas.height = 288;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Session list renderer unavailable');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 576, 288);
  ctx.fillStyle = '#fff'; ctx.font = '18px Arial';
  const fit = (text: string, width: number) => {
    if (ctx.measureText(text).width <= width) return text;
    let shortened = text;
    while (shortened && ctx.measureText(shortened + '…').width > width) shortened = [...shortened].slice(0, -1).join('');
    return shortened + '…';
  };
  const count = `${view.count} connected terminals`;
  const countWidth = ctx.measureText(count).width;
  ctx.textAlign = 'left'; ctx.fillText(fit(`Orca-glass ${__APP_VERSION__}`, 548 - countWidth), 12, 23);
  ctx.textAlign = 'right'; ctx.fillText(count, 564, 23);
  for (let i = 0; i < view.rows.length; i++) {
    const row = view.rows[i], baseline = 64 + i * 24;
    const rightWidth = row.right ? ctx.measureText(row.right).width : 0;
    if (i === view.selected) {
      ctx.fillRect(4, baseline - 19, 568, 1); ctx.fillRect(4, baseline + 4, 568, 1);
      ctx.fillRect(4, baseline - 19, 1, 24); ctx.fillRect(571, baseline - 19, 1, 24);
    }
    ctx.textAlign = 'left';
    let left = row.left;
    if (row.handle) {
      if (row.state === 'busy') {
        const pixels = statusPixels(SPINNER[view.frame % SPINNER.length]);
        for (let y = 0; y < 28; y++) for (let x = 0; x < 20; x++) {
          if (pixels[y * 20 + x]) ctx.fillRect(12 + x * 0.65, baseline - 17 + y * 0.65, 1, 1);
        }
      } else ctx.fillText(row.state === 'idle' ? '/' : '?', 12, baseline);
      ctx.fillText(fit(left, 520 - rightWidth), 32, baseline);
    } else ctx.fillText(fit(left, 544 - rightWidth), 12, baseline);
    if (row.right) { ctx.textAlign = 'right'; ctx.fillText(row.right, 564, baseline); }
  }
  return SESSION_TILES.map(tile => {
    const data = ctx.getImageData(tile.xPosition, tile.yPosition, 288, 144).data;
    return Array.from({ length: 288 * 144 }, (_, i) => data[i * 4]);
  });
}
