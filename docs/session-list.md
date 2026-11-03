# Session list
Updated: 2026-11-02

The header displays `Orca-glass VERSION` using the packaged manifest version,
with the total connected-terminal count right-aligned. Refresh begins with `*`;
the selected filter appears at its right (`[All sessions]`, `[Codex]`, etc.).
Each session shows its title and six-character handle suffix, with a provider
label aligned to the right. Idle rows begin with `/`. Working rows use the ten
Braille patterns rendered as pixels, avoiding missing firmware glyphs. Unknown
activity uses `?`. State comes from the exact worktree/pane activity record,
independently of mutable terminal titles.

The native list API has no independent right-aligned columns or incremental list
update. This page therefore uses four288x144 images and its own highlighted row
selection. Up/down moves highlight, Click invokes that row, and explicit previous/
next actions keep all terminals reachable, four per page. Long titles truncate
with an ellipsis before the provider column. Contextual Filter by Agent remains
native; the filter-selection page and session reader keep their existing layouts.
No change to reader swipe scrolling or no-op Click inside conversations.

Braille animation runs on a200ms tick and uploads only changed image tiles.
Visible rows refresh their titles/agent/activity every six completed ticks; new
or removed session membership is reconciled through Refresh. Total count includes
all connected sessions even when a provider filter is selected. No page rebuild
is performed during animation, so highlight remains stable.

Validation:62 tests, TypeScript/Vite build and doctor passed. Official simulator
verified home→session navigation and native Menu→filter→Codex list. Screenshot
diff between animation frames was confined to spinner x13..25/y120..133.
G2 appearance/navigation remains pending; synthetic demo providers are not live
Claude interaction.

This fork is English-only: app manifest, settings/interface, demo, bridge labels,
templates and speech transcription use English. Legacy Japanese/auto preferences
resolve English. Root `/images/` is ignored for user reference pictures. Existing
conversation content is displayed as supplied; it is not translated.
