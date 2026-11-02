// Program titles can become "Codex ready". Resolve names by exact workspace/tab
// identity, never by title, directory similarity, or most-recent activity.
const lastNames = new Map();
export function sessionTitles(layouts = [], worktrees = []) {
  const names = new Map();
  for (const workspace of worktrees) {
    for (const agent of workspace.agents || []) {
      if (agent.paneKey && typeof agent.conversationName === 'string' && agent.conversationName.trim()) {
        names.set(`${workspace.worktreeId}\0pane:${agent.paneKey}`, agent.conversationName.trim());
      }
    }
  }
  for (const layout of layouts) {
    const visit = node => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node.tabs)) {
        for (const tab of node.tabs) {
          if (tab.tabId && typeof tab.title === 'string' && tab.title.trim()) {
            names.set(`${layout.worktreeId}\0${tab.tabId}`, tab.title.trim());
          }
        }
      }
      for (const child of Object.values(node)) {
        if (Array.isArray(child)) child.forEach(visit);
        else if (child && typeof child === 'object') visit(child);
      }
    };
    visit(layout.root);
  }
  return names;
}

export function sessionTitle(terminal, names) {
  const conversation = names.get(`${terminal.worktreeId}\0pane:${terminal.tabId}:${terminal.leafId}`);
  const tab = names.get(`${terminal.worktreeId}\0${terminal.tabId}`);
  // Auto-generated worker tab names contain less information than their TUI title.
  const namedConversation = conversation && !/^worker-task_/i.test(conversation) ? conversation : null;
  const namedTab = tab && !/^worker-task_/i.test(tab) ? tab : null;
  const title = (terminal.paneTitle?.trim() || namedConversation || namedTab || terminal.title || 'Untitled')
    .replace(/^[✳◐◓◑◒⠁-⣿]\s*/u, '');
  // Idle metadata can temporarily lose the conversation name too. Retain only
  // this exact running pane's last meaningful name, never another incarnation's.
  const key = terminal.incarnationId && `${terminal.worktreeId}\0${terminal.tabId}:${terminal.leafId}\0${terminal.incarnationId}`;
  if (key && /^codex ready\b/i.test(title)) return lastNames.get(key) || title;
  if (key && title !== 'Untitled') {
    lastNames.set(key, title);
    if (lastNames.size > 2000) lastNames.delete(lastNames.keys().next().value);
  }
  return title;
}
