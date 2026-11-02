// Program titles can become "Codex ready". Resolve names by exact workspace/tab
// identity, never by title, directory similarity, or most-recent activity.
export function sessionTitles(layouts = []) {
  const names = new Map();
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
  const tab = names.get(`${terminal.worktreeId}\0${terminal.tabId}`);
  // Auto-generated worker tab names contain less information than their TUI title.
  const namedTab = tab && !/^worker-task_/i.test(tab) ? tab : null;
  return (terminal.paneTitle?.trim() || namedTab || terminal.title || 'Untitled')
    .replace(/^[✳◐◓◑◒⠁-⣿]\s*/u, '');
}
