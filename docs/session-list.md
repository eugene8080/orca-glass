# Session list
Updated: 2026-11-02

Version1.0.12 is an authorized compact native-text trial. The sessions page uses
one multiline native text container with a `>` selection cursor, following the
pattern described in Nick Ustinov's public UI notes. Four terminals/page and
Previous/Next actions yield at most9 compact lines. Swipe moves selection using
one textContainerUpgrade; rapid moves coalesce to the latest index. Click and
Filter navigation wait for pending writes to finish. No list images or animation
timers. The filter page still uses the native list; reader/voice unchanged.
Titles truncate inside48 bytes while preserving the provider/handle suffix.
63 tests/build pass, including one update per move and rapid-swipe coalescing.
Official simulator compact layout/cursor/session/filter checks passed. G2 speed
check pending; no claim that Books' exact implementation has been reproduced.

The following1.0.11 details are historical and superseded for the session menu.

Version1.0.11 restores native text/list controls after the user reported that
1.0.10 custom image rendering was too slow. No session-list images or animation
/polling timers remain. Firmware owns selection and scrolling. Up to15 terminals
per page; Previous/Next actions keep all terminals reachable.

Header: `Orca-glass VERSION · COUNT connected terminals`, using manifest version.
Refresh: `* Refresh sessions [All sessions]` or selected provider. Session rows
contain status, title, six-character handle suffix and `[Agent]`. Native text has
no independent right-aligned columns; labels are inline. Titles truncate within
63 bytes while preserving handle/provider suffix.

Status: `/` idle, `*` working, `?` unknown, based on exact Orca worktree/pane
activity, updated by Refresh. The image-based Braille list animation was removed;
the separate reader footer spinner is unchanged.

62 tests/build pass, including no list images/timers, native capture/selection,
pagination and long Unicode title suffix retention. Native simulator shows list
and opens selected session. G2 speed confirmation pending. English-only settings
and root /images ignore remain.
