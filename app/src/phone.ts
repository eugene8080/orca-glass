// Phone page (the Even app's WebView): connection status, the same Filter by
// Agent / Filter by Workspace selections the glasses use, and provider usage.
// Session titles and workspace names come from the PC, so every value is set with
// textContent, never innerHTML.
import { api, type Thread, type Usage, type UsageLimit, type Workspace } from './api';
import { orcaAgents, workspaceSections, toggleWorkspace, workspaceSummary } from './filters';
import { formatReset, RESET_MODES, type ResetMode } from './usage-reset';
import { t as tr, type Key } from './i18n';

export type Connection =
  | { state: 'connected'; ms: number }
  | { state: 'demo' }
  | { state: 'offline'; error: string }
  | { state: 'unpaired' }
  | { state: 'connecting' };

export type PhoneDeps = {
  // The glasses own these values; the phone reads and writes them through main.ts
  // so both screens stay in step (main re-renders the glasses after a phone change).
  filters(): { provider: string; orca: Set<string> | null; hermes: Set<string> | null };
  setProvider(id: string): Promise<void>;
  setWorkspaces(hermes: boolean, value: Set<string> | null): Promise<void>;
  resetMode(): ResetMode;
  setResetMode(mode: ResetMode): Promise<void>;
  agentName(id: string): string;
};

// Dictionary keys, looked up at render time so a language change applies at once.
const MODE_LABEL: Record<ResetMode, Key> = { computer: 'modeComputer', phone: 'modePhone', absolute: 'modeAbsolute' };
const WINDOWS = [['session', 'window5h'], ['weekly', 'windowWeekly'], ['monthly', 'windowMonthly']] as const;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export function createPhone(deps: PhoneDeps) {
  let threads: Thread[] = [];
  let catalog: Workspace[] = [];
  let usage: Usage | null = null;
  let usageError = '';
  let loaded = false;
  let loading: Promise<void> | null = null;
  let workspacesOpen = false;
  let lastConnection: Connection = { state: 'connecting' };
  const names = new Map<string, string>();

  // Tabs: Home (status, filters, usage, composer) and Settings (setup and log).
  for (const [tab, page] of [['tab-home', 'page-home'], ['tab-settings', 'page-settings']] as const) {
    byId(tab).addEventListener('click', () => {
      for (const [t, p] of [['tab-home', 'page-home'], ['tab-settings', 'page-settings']] as const) {
        byId(t).classList.toggle('on', t === tab);
        byId(p).hidden = p !== page;
      }
    });
  }
  byId('conn-toggle').addEventListener('click', () => setConnOpen(byId('conn-body').hidden));
  byId('ws-toggle').addEventListener('click', () => { workspacesOpen = !workspacesOpen; renderFilters(); });
  byId('usage-refresh').addEventListener('click', () => { void load(); });
  byId<HTMLSelectElement>('agent-filter').addEventListener('change', async ev => {
    const id = (ev.target as HTMLSelectElement).value;
    await deps.setProvider(id);
    renderFilters();
  });
  const modes = byId('reset-mode');
  for (const mode of RESET_MODES) {
    const button = el('button', 'seg-item', tr(MODE_LABEL[mode]));
    button.type = 'button';
    button.dataset.mode = mode;
    button.addEventListener('click', async () => { await deps.setResetMode(mode); renderUsage(); });
    modes.append(button);
  }

  function setConnOpen(open: boolean) {
    byId('conn-body').hidden = !open;
    byId('conn-chevron').textContent = open ? '▴' : '▾';
  }

  function connection(c: Connection) {
    lastConnection = c;
    const dot = byId('conn-dot');
    dot.className = `dot ${c.state === 'connected' || c.state === 'demo' ? 'ok' : c.state === 'offline' ? 'bad' : ''}`;
    byId('conn-text').textContent = connectionText(c);
    const usable = c.state === 'connected' || c.state === 'demo';
    // Like a first run: without a connection, only pairing is shown.
    byId('filters-card').hidden = !usable;
    byId('usage-card').hidden = !usable;
    if (c.state === 'unpaired' || c.state === 'offline') setConnOpen(true);
    if (usable) { setConnOpen(false); void load(); }
  }

  function connectionText(c: Connection) {
    return c.state === 'connected' ? tr('connConnected', c.ms)
      : c.state === 'demo' ? tr('connDemo')
      : c.state === 'offline' ? tr('connOffline', c.error)
      : c.state === 'connecting' ? tr('connConnecting') : tr('connUnpaired');
  }

  // Language change: redraw every text this module wrote; data-i18n text is
  // handled by applyPage() in main.ts.
  function retranslate() {
    byId('conn-text').textContent = connectionText(lastConnection);
    modes.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.textContent = tr(MODE_LABEL[button.dataset.mode as ResetMode]); });
    if (!loading) byId('usage-refresh').textContent = tr('refresh');
    render();
  }

  async function load() {
    if (loading) return loading;
    loading = (async () => {
      byId('usage-refresh').textContent = tr('refreshing');
      const [t, w, u] = await Promise.allSettled([api.threads(), api.workspaces(), api.usage()]);
      if (t.status === 'fulfilled') threads = t.value;
      if (w.status === 'fulfilled') catalog = w.value;
      if (u.status === 'fulfilled') { usage = u.value; usageError = ''; }
      else usageError = (u.reason as Error)?.message || '';
      for (const x of threads) if (x.workspaceId) names.set(x.workspaceId, (x.agent === 'hermes' ? x.workspaceLabel : x.workspaceName) || x.workspaceLabel || x.workspaceName || tr('workspaceFallback'));
      for (const x of catalog) names.set(x.id, x.name);
      loaded = true;
      render();
    })().finally(() => { loading = null; byId('usage-refresh').textContent = tr('refresh'); });
    return loading;
  }

  function render() {
    if (!loaded) return;
    renderFilters();
    renderUsage();
  }

  function renderFilters() {
    if (!loaded) return;
    const f = deps.filters();
    const hermes = f.provider === 'hermes';
    // Agent select: Hermes Agent, a divider, then All Orca sessions and each agent,
    // with session counts so an empty filter is visible before choosing it.
    const select = byId<HTMLSelectElement>('agent-filter');
    const count = (id: string) => threads.filter(t => id === 'hermes' ? t.agent === 'hermes' : t.agent !== 'hermes' && (id === 'all' || t.agent === id)).length;
    const options: [string, string][] = [['hermes', 'Hermes Agent'], ['', '──────────'],
      ...orcaAgents(threads, f.provider).map((id): [string, string] => [id, id === 'all' ? tr('allOrcaSessionsRow') : deps.agentName(id)])];
    select.replaceChildren(...options.map(([id, label]) => {
      const option = el('option', '', id ? `${label} (${count(id)})` : label);
      option.value = id;
      option.disabled = !id;
      option.selected = id === f.provider;
      return option;
    }));
    const chosen = hermes ? f.hermes : f.orca;
    byId('ws-label').textContent = hermes ? tr('filterWorkspaceHermes') : tr('filterWorkspace');
    byId('ws-toggle').textContent = `${workspaceSummary(chosen, names)} ${workspacesOpen ? '▴' : '▾'}`;
    const list = byId('ws-list');
    list.hidden = !workspacesOpen;
    if (!workspacesOpen) return;
    const save = (value: Set<string> | null) => async () => { await deps.setWorkspaces(hermes, value); renderFilters(); };
    const row = (label: string, checked: boolean, onChange: () => Promise<void>) => {
      const wrap = el('label', 'check');
      const box = el('input');
      box.type = 'checkbox';
      box.checked = checked;
      box.addEventListener('change', () => { void onChange(); });
      wrap.append(box, el('span', '', label));
      return wrap;
    };
    const sections = workspaceSections(threads, catalog, hermes, chosen, names);
    list.replaceChildren(
      row(tr('allWorkspaces'), chosen === null, save(null)),
      ...sections.flatMap(section => [
        ...(section.title ? [el('div', 'section', section.title)] : []),
        ...section.rows.map(([id, name]) => row(name, !!chosen?.has(id), () => save(toggleWorkspace(deps.filters()[hermes ? 'hermes' : 'orca'], id))())),
      ]),
    );
  }

  function renderUsage() {
    if (!loaded) return;
    const mode = deps.resetMode();
    byId("reset-mode").querySelectorAll<HTMLButtonElement>("button").forEach(button => button.classList.toggle('on', button.dataset.mode === mode));
    const body = byId('usage-body');
    if (!usage) { body.replaceChildren(el('p', 'muted', usageError || tr('usageUnavailable'))); return; }
    const providers = Object.entries(usage).filter(([, v]) => v && typeof v === 'object' && 'provider' in v);
    const blocks = providers.map(([name, v]) => {
      const block = el('div', 'provider');
      block.append(el('div', 'provider-name', deps.agentName(v.provider || name)));
      if (v.status !== 'ok') { block.append(el('p', 'muted', tr('usageStatusUnavailable'))); return block; }
      const windows = WINDOWS.filter(([key]) => v[key]);
      if (!windows.length) block.append(el('p', 'muted', tr('usageNone')));
      for (const [key, label] of windows) {
        const limit = v[key] as UsageLimit;
        const percent = Math.max(0, Math.min(100, Math.round(limit.usedPercent * 10) / 10));
        const line = el('div', 'limit');
        line.append(el('span', 'pct', `${percent}%`), el('span', 'muted', tr('usageLimitLine', tr(label), formatReset(limit, mode))));
        const bar = el('div', 'bar');
        const fill = el('div', 'fill');
        fill.style.width = `${percent}%`;
        bar.append(fill);
        block.append(line, bar);
      }
      return block;
    });
    body.replaceChildren(...(blocks.length ? blocks : [el('p', 'muted', tr('usageNone'))]));
  }

  // Absolute (time remaining) changes every minute; nothing else needs a timer.
  setInterval(() => { if (deps.resetMode() === 'absolute') renderUsage(); }, 60000);

  return { connection, load, render, retranslate };
}
