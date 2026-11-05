import { clipBytes, glassTextWidth } from './text';
declare const __APP_VERSION__: string;
export const agentLabel = (id: string) => ({ hermes: 'Hermes', codex: 'Codex', claude: 'Claude', pi: 'Pi', cursor: 'Cursor', opencode: 'OpenCode', gemini: 'Gemini' }[id] || id);
export const sessionListTitle = (count: number) => `Orca-glass ${__APP_VERSION__} · ${count} sessions`;

// Preserve the handle/provider suffix inside the native 48-byte compact text-row budget.
export function sessionRow(title: string, handle: string, agent: string, state: string, workspace = ''): string {
  const prefix = state === 'idle' ? '/ ' : state === 'busy' ? '* ' : '? ';
  const suffix = ` · ${handle.slice(-6)} ${sessionAgentLabel(workspace, agent)}`;
  const budget = Math.max(0, 48 - new TextEncoder().encode(prefix + suffix).length);
  return prefix + clipBytes(title, budget) + suffix;
}

export type SessionColumns = { marker: string; title: string; right: string; busy?: boolean; handle?: string };
export const sessionHeading = () => `Orca-glass ${__APP_VERSION__}`;
// Titles span to the right edge and sit under the right-label column; each row's
// title is fitted to end before its own label, so short labels leave more title.
export const MENU_LEFT = { containerID: 2, containerName: 'body', xPosition: 28, yPosition: 28, width: 548, height: 260 };
const TITLE_LABEL_GAP = 8;
const TITLE_BYTES = 60;
export const MENU_RIGHT = { xPosition: 328, width: 248 };
// Width of native list text: measured firmware advances for ASCII, Arial for the rest.
function glassWidth(text: string): number {
  const ctx = document.createElement('canvas').getContext('2d');
  if (ctx) ctx.font = '21px Arial';
  return glassTextWidth(text, ch => ctx ? ctx.measureText(ch).width : 21);
}
export function sessionAgentLabel(workspace: string, agent: string): string {
  const provider = agentLabel(agent);
  if (!workspace) return `[${provider}]`;
  let name = workspace;
  while (name.length > 1 && glassWidth(`[${name}${name === workspace ? '' : '…'}/${provider}]`) > MENU_RIGHT.width) name = name.slice(0, -1);
  return `[${name}${name === workspace ? '' : '…'}/${provider}]`;
}
export const MENU_CURSOR = { containerID: 4, containerName: 'menu-cursor', xPosition: 0, yPosition: 28, width: 32, height: 260 };
// Keep arrow plus three marker cells inside the gutter, including selected rows.
// An extra separator can wrap one row and displace every later marker.
// The dot moves in the existing cursor gutter. Session titles never get rewritten
// during animation, and there is no trailing text padding before the title column.
export const MENU_DOTS = ['·  ', ' · ', '  ·'];
export function menuNativeText(rows: SessionColumns[]): string {
  return rows.map(row => ' ' + menuTitle(row.title, MENU_LEFT.width - 4 - (row.right ? glassWidth(row.right) + TITLE_LABEL_GAP : 0))).join('\n');
}
export function menuCursorText(rows: SessionColumns[], selected: number, frame = 0): string {
  return rows.map((row, i) => `${i === selected ? '>' : ' '}${row.busy ? MENU_DOTS[frame % MENU_DOTS.length] : row.marker || ' '}`).join('\n');
}
// Native text has no alignment flag. Pad a dedicated right column using measured
// proportional text widths; no labels are rasterized or transferred as images.
// Simulator check: a 278px line wraps in a 280px hint, 277px fits, so keep 3px slack.
export function nativeRight(text: string, width: number): string {
  return ' '.repeat(Math.max(0, Math.floor((width - 3 - glassWidth(text)) / glassWidth(' ')))) + text;
}
// Shorten the title head and keep any ' · handle' suffix so rows stay distinguishable.
export function menuTitle(text: string, maxWidth = MENU_LEFT.width - 4): string {
  const cut = text.lastIndexOf(' · ');
  const suffix = cut > 0 ? text.slice(cut) : '';
  let head = clipBytes(cut > 0 ? text.slice(0, cut) : text, TITLE_BYTES - new TextEncoder().encode(suffix).length);
  while (head.length > 1 && glassWidth(' ' + head + suffix) > maxWidth) head = head.replace(/…$/, '').slice(0, -1) + '…';
  return head + suffix;
}
export function compactSessionTitle(title: string, handle: string): string {
  const suffix = ` · ${handle.slice(-6)}`;
  return clipBytes(title, TITLE_BYTES - new TextEncoder().encode(suffix).length) + suffix;
}
export const cursorText = (count: number, selected: number) => Array.from({ length: count }, (_, i) => i === selected ? '>' : ' ').join('\n');
