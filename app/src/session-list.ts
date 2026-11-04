import { clipBytes } from './text';
declare const __APP_VERSION__: string;
export const agentLabel = (id: string) => ({ codex: 'Codex', claude: 'Claude', pi: 'Pi', cursor: 'Cursor', opencode: 'OpenCode', gemini: 'Gemini' }[id] || id);
export const sessionListTitle = (count: number) => `Orca-glass ${__APP_VERSION__} · ${count} connected terminals`;

// Preserve the handle/provider suffix inside the native 48-byte compact text-row budget.
export function sessionRow(title: string, handle: string, agent: string, state: string, workspace = ''): string {
  const prefix = state === 'idle' ? '/ ' : state === 'busy' ? '* ' : '? ';
  const suffix = ` · ${handle.slice(-6)} ${sessionAgentLabel(workspace, agent)}`;
  const budget = Math.max(0, 48 - new TextEncoder().encode(prefix + suffix).length);
  return prefix + clipBytes(title, budget) + suffix;
}

export type SessionColumns = { marker: string; title: string; right: string; busy?: boolean; handle?: string };
export const sessionHeading = () => `Orca-glass ${__APP_VERSION__}`;
export const MENU_LEFT = { containerID: 2, containerName: 'body', xPosition: 28, yPosition: 28, width: 296, height: 260 };
export const MENU_RIGHT = { xPosition: 328, width: 248 };
export function sessionAgentLabel(workspace: string, agent: string): string {
  const provider = agentLabel(agent);
  if (!workspace) return `[${provider}]`;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return `[${clipBytes(workspace, 18)}/${provider}]`;
  ctx.font = '21px Arial';
  let name = workspace;
  while (name.length > 1 && ctx.measureText(`[${name}${name === workspace ? '' : '…'}/${provider}]`).width > MENU_RIGHT.width) name = name.slice(0, -1);
  return `[${name}${name === workspace ? '' : '…'}/${provider}]`;
}
export const MENU_CURSOR = { containerID: 4, containerName: 'menu-cursor', xPosition: 0, yPosition: 28, width: 32, height: 260 };
// Keep arrow plus three marker cells inside the gutter, including selected rows.
// An extra separator can wrap one row and displace every later marker.
// The dot moves in the existing cursor gutter. Session titles never get rewritten
// during animation, and there is no trailing text padding before the title column.
export const MENU_DOTS = ['·  ', ' · ', '  ·'];
export function menuNativeText(rows: SessionColumns[]): string {
  return rows.map(row => ' ' + menuTitle(row.title)).join('\n');
}
export function menuCursorText(rows: SessionColumns[], selected: number, frame = 0): string {
  return rows.map((row, i) => `${i === selected ? '>' : ' '}${row.busy ? MENU_DOTS[frame % MENU_DOTS.length] : row.marker || ' '}`).join('\n');
}
// Native text has no alignment flag. Pad a dedicated right column using measured
// proportional text widths; no labels are rasterized or transferred as images.
export function nativeRight(text: string, width: number): string {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text;
  ctx.font = '21px Arial';
  const space = ctx.measureText(' ').width || 6;
  return ' '.repeat(Math.max(0, Math.floor((width - ctx.measureText(text).width) / space))) + text;
}
export function menuTitle(text: string): string {
  let title = clipBytes(text, 37);
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return title;
  ctx.font = '21px Arial';
  while (title.length > 1 && ctx.measureText(' ' + title).width > MENU_LEFT.width - 4) title = title.replace(/…$/, '').slice(0, -1) + '…';
  return title;
}
export function compactSessionTitle(title: string, handle: string): string {
  const suffix = ` · ${handle.slice(-6)}`;
  return clipBytes(title, 37 - new TextEncoder().encode(suffix).length) + suffix;
}
export const cursorText = (count: number, selected: number) => Array.from({ length: count }, (_, i) => i === selected ? '>' : ' ').join('\n');
