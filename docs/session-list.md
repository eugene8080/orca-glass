# Session list
Updated: 2026-11-03

2026-11-03 hardware confirmation: User confirms menu text remains stable during up/down swipes on physical G2. Startup/load and screen rejection recovery also confirmed. Spinner/alignment/filter placement are separate checks.

Version1.0.16: Filter by Agent is the first main-list row; its right column shows
All sessions or selected provider. Refresh is second, followed by New Session,
Usage and terminals. Filter is removed from contextual menu; OS controls remain.
First page has up to4 terminals, later pages up to3 so neither page exceeds9 rows.
Activity polls every3s independently of navigation. Marker strips render static
icons and animated Braille above the native title gutter; title text stays native
and stationary. Polling/animation stop on page change or system exit. Persistent
phone label distinguishes Aligned native text from Compact compatibility mode.
The user confirmed1.0.15 opens on both phone and G2;1.0.16 rendering pending.

Version1.0.15 recovery: user still gets rejected-screen status after force-stop.
Initial startup now uses the known small two-text shape, then attempts aligned
menu through rebuild. If rejected, it rebuilds a three-text compact menu with a
separate blank input capture. This keeps text stationary while cursor updates
the compact body; labels are inline and marker images are disabled in fallback.
Successful fallback is retained for subsequent menus during that app run. Phone
Status identifies fallback activation and phone heading shows installed version.
The cursor container is24px wide (previously16), removing a possible firmware
size constraint; exact original hardware rejection cause remains unconfirmed.
68 tests/build pass. Isolated simulator explicitly rejected aligned rebuilds;
fallback native rendering, selection and entry into reader passed. Hardware
acceptance is pending. Do not describe fallback as satisfying right alignment
or animated list Braille, which remain conditional on aligned-layout acceptance.

Version1.0.14 compatibility repair follows G2 startup rejection in1.0.13.
The menu now has six native text containers plus two narrow image strips,
IDs1..8 and layers0..7. Marker text is merged into title text, above the image
strips; capture and selection cursor stay separate. The prior page declared
nine containers and included layer9. Firmware rejection cause is not proven;
this removes both count/range compatibility risks.67 tests/build pass and native
simulator menu/reader navigation works. G2 validation remains pending.

The one-shot startup call is marked consumed before awaiting its result.
If rejected, the error/reconnect path uses rebuild rather than repeating create.

2026-11-03 version1.0.13 supersedes the moving-block1.0.12 trial. A dedicated
blank native text container captures gestures. Static native title/marker/right
columns never receive cursor updates; a separate cursor column alone changes.
Header is Orca-glass VERSION with a right-hand connected count. Refresh has *
and the current filter on its right; session providers occupy a right column,
idle entries use / and active entries have animated Braille. Native text has
no alignment flag, so right columns use measured proportional-width space
padding; actual G2 alignment requires checking. Only Braille dots use images:
two20px-wide strips, serial guarded updates every500ms, no image labels/menus.
All row/title/agent text remains native. The native simulator title/right crop
is pixel-identical after a swipe. User verified1.0.12 speed;1.0.13 hardware speed,
stability and alignment remain pending.

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
