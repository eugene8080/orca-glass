# Session list
Updated: 2026-11-02

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
