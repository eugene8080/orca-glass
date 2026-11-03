import { clipBytes } from './text';
declare const __APP_VERSION__: string;
export const agentLabel = (id: string) => ({ codex: 'Codex', claude: 'Claude', pi: 'Pi', cursor: 'Cursor', opencode: 'OpenCode', gemini: 'Gemini' }[id] || id);
export const sessionListTitle = (count: number) => `Orca-glass ${__APP_VERSION__} · ${count} connected terminals`;

// Preserve the handle/provider suffix inside the native 63-byte row budget.
export function sessionRow(title: string, handle: string, agent: string, state: string): string {
  const prefix = state === 'idle' ? '/ ' : state === 'busy' ? '* ' : '? ';
  const suffix = ` · ${handle.slice(-6)} [${agentLabel(agent)}]`;
  const budget = Math.max(0, 63 - new TextEncoder().encode(prefix + suffix).length);
  return prefix + clipBytes(title, budget) + suffix;
}
