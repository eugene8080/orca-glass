// Shared by the glasses pickers and the phone page, so both always list the same
// agents and workspaces in the same order. Pure: no bridge, storage or DOM access.
import type { Thread, Workspace } from './api';

// Filter by Agent: Orca agent ids after Hermes Agent and the divider. All Orca
// sessions, Claude and Codex always; then any other agent seen in the session
// list; a saved choice that has no sessions right now stays selectable.
export function orcaAgents(threads: Thread[], viewProvider: string): string[] {
  const ids = ['all', 'claude', 'codex', ...threads.map(t => t.agent).filter(a => !!a && a !== 'hermes')]
    .filter((id, index, all) => all.indexOf(id) === index);
  if (viewProvider !== 'hermes' && !ids.includes(viewProvider)) ids.push(viewProvider);
  return ids;
}

export const RECENT_WORKSPACES = 4;
export type PickerRow = [id: string, name: string];
export type PickerSection = { title?: string; rows: PickerRow[] };

// Orca: Recent workspaces (four most recently active), then Other workspaces
// (alphabetical). Hermes (not part of Orca): Bots, Sessions, Scheduled jobs, as in
// Hermes Desktop. Saved selections that no longer exist are listed last as
// Unavailable so they can be cleared. Empty sections are dropped.
export function workspaceSections(threads: Thread[], catalog: Workspace[], hermesOnly: boolean,
  chosen: Set<string> | null, knownNames: Map<string, string> = new Map()): PickerSection[] {
  const sessions = threads.filter(t => (t.agent === 'hermes') === hermesOnly);
  const entries = catalog.filter(w => !!w.hermes === hermesOnly);
  const names = new Map<string, string>(entries.map(w => [w.id, w.name]));
  const kinds = new Map<string, string>(entries.filter(w => w.hermes).map(w => [w.id, w.hermes!]));
  for (const t of sessions) if (t.workspaceId) {
    names.set(t.workspaceId, t.workspaceLabel || t.workspaceName || 'Workspace');
    if (t.hermesGroup) kinds.set(t.workspaceId, t.hermesGroup);
  }
  // Recency: Orca's activity time, a job's last run, or a newer session output.
  const activity = new Map<string, number>();
  for (const w of entries) if (w.lastActivityAt) activity.set(w.id, w.lastActivityAt);
  for (const t of sessions) if (t.workspaceId && t.lastOutputAt) activity.set(t.workspaceId, Math.max(activity.get(t.workspaceId) || 0, t.lastOutputAt));
  const byRecency = (a: PickerRow, b: PickerRow) => (activity.get(b[0]) || 0) - (activity.get(a[0]) || 0) || a[1].localeCompare(b[1]);
  const rows = [...names] as PickerRow[];
  let sections: PickerSection[];
  if (hermesOnly) {
    sections = [['Bots', 'bot'], ['Sessions', 'session'], ['Scheduled jobs', 'job']]
      .map(([title, kind]) => ({ title, rows: rows.filter(([id]) => (kinds.get(id) || 'session') === kind).sort(byRecency) }));
  } else {
    const recent = rows.filter(([id]) => activity.has(id)).sort(byRecency).slice(0, RECENT_WORKSPACES);
    const recentIds = new Set(recent.map(([id]) => id));
    const others = rows.filter(([id]) => !recentIds.has(id)).sort((a, b) => a[1].localeCompare(b[1]));
    sections = recent.length ? [{ title: 'Recent workspaces', rows: recent }, { title: 'Other workspaces', rows: others }] : [{ rows: others }];
  }
  const listed = new Set(rows.map(([id]) => id));
  const known = new Map(catalog.map(w => [w.id, w.name]));
  const elsewhere = [...chosen || []].filter(id => !listed.has(id)).map((id): PickerRow => [id,
    known.get(id) || knownNames.get(id) || `${id.replaceAll('\\', '/').split('/').pop() || 'Workspace'} (unavailable)`]);
  if (elsewhere.length) sections.push({ title: 'Unavailable', rows: elsewhere });
  return sections.filter(x => x.rows.length);
}

// The glasses' and phone's workspace toggle: from All, picking one workspace
// selects only that one; an explicit empty set means None.
export function toggleWorkspace(chosen: Set<string> | null, id: string): Set<string> {
  const next = new Set(chosen ?? []);
  if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}

export function workspaceSummary(chosen: Set<string> | null, names: Map<string, string>): string {
  return chosen === null ? 'All workspaces' : chosen.size === 0 ? 'None' : chosen.size === 1 ? names.get([...chosen][0]) || '1 selected' : `${chosen.size} selected`;
}
