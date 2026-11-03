import { clipBytes } from './text';
declare const __APP_VERSION__: string;
export const agentLabel = (id: string) => ({ codex: 'Codex', claude: 'Claude', pi: 'Pi', cursor: 'Cursor', opencode: 'OpenCode', gemini: 'Gemini' }[id] || id);
export const sessionListTitle = (count: number) => `Orca-glass ${__APP_VERSION__} · ${count} connected terminals`;

// Preserve the handle/provider suffix inside the native 48-byte compact text-row budget.
export function sessionRow(title: string, handle: string, agent: string, state: string): string {
  const prefix = state === 'idle' ? '/ ' : state === 'busy' ? '* ' : '? ';
  const suffix = ` · ${handle.slice(-6)} [${agentLabel(agent)}]`;
  const budget = Math.max(0, 48 - new TextEncoder().encode(prefix + suffix).length);
  return prefix + clipBytes(title, budget) + suffix;
}

export type SessionColumns = { marker: string; title: string; right: string; busy?: boolean };
export const sessionHeading = () => `Orca-glass ${__APP_VERSION__}`;
export const MENU_LEFT = { containerID: 2, containerName: 'body', xPosition: 16, yPosition: 40, width: 376, height: 248 };
export const MENU_CURSOR = { containerID: 4, containerName: 'menu-cursor', xPosition: 0, yPosition: 40, width: 24, height: 248 };
export const MENU_STRIPS = [
  { containerID: 7, containerName: 'menu-spin-top', xPosition: 16, yPosition: 40, width: 20, height: 144 },
  { containerID: 8, containerName: 'menu-spin-bottom', xPosition: 16, yPosition: 184, width: 20, height: 104 },
];
// Native text has no alignment flag. Pad a dedicated right column using measured
// proportional text widths; no labels are rasterized or transferred as images.
export function nativeRight(text: string, width: number): string {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text;
  ctx.font = '21px Arial';
  const space = ctx.measureText(' ').width || 6;
  return ' '.repeat(Math.max(0, Math.floor((width - ctx.measureText(text).width) / space))) + text;
}
export function menuTitle(text: string): string { return clipBytes(text, 37); }
export function compactSessionTitle(title: string, handle: string): string {
  const suffix = ` · ${handle.slice(-6)}`;
  return clipBytes(title, 37 - new TextEncoder().encode(suffix).length) + suffix;
}
export const cursorText = (count: number, selected: number) => Array.from({ length: count }, (_, i) => i === selected ? '>' : ' ').join('\n');
