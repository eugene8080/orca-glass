# Books rendering investigation
Updated: 2026-11-02

User reports Books for Even G2 v3.2.1 (Nick Ustinov) has dense, fast menus and
asks for investigation. No app/bridge behavior or beta changed for this work.

## What is verified

Author GitHub profile `nickustinov` listed29 public repositories when checked
through GitHub API. Neither page1 nor page2 contained a Books repository;
`nickustinov/books-even-g2` returned404. This does not prove Books is private or
identify its implementation. Requested an optional website/source link from the
user. The supplied image is the phone WebView about/log page, not a glasses
rendering trace, so it cannot establish native text versus image rendering.

The author's public G2 notes at commit
`227c866718fbb68907ef723592c8a4d90630e823` document both native-text custom menus
and image-based interfaces. Custom menu structure does not imply bitmap text:
`docs/ui-patterns.md` describes a text cursor, swipe changing selection and
`textContainerUpgrade` updating it. `docs/display.md` explains text containers,
native list scroll takeover, fixed firmware font and image tiling limits.

Source links:
- https://github.com/nickustinov/even-g2-notes/blob/227c866718fbb68907ef723592c8a4d90630e823/docs/ui-patterns.md
- https://github.com/nickustinov/even-g2-notes/blob/227c866718fbb68907ef723592c8a4d90630e823/docs/display.md
- https://github.com/nickustinov/even-g2-notes/blob/227c866718fbb68907ef723592c8a4d90630e823/docs/performance.md

## Why Orca Glass1.0.10 was slow

Inspection of commit6d4d593 finds four288x144 image tiles. `paintSessionList`
defaults its previous-pixels cache to an empty array. The selection handler
calls it without a cache, so every highlight movement serially uploads all four
tiles, even when almost all pixels are unchanged. Each call joins `panelWrites`;
there is no coalescing to discard superseded navigation paints. Rapid swipes
can therefore enqueue repeated full-screen transfers. The animation path has a
separate previous-frame cache; its changed-tile optimization did not cover the
navigation path. Periodic network reads can also pause the animation callback.

The author's measurements (G2 firmware2.2.7.14, Even App2.2.7, SDK0.0.13,
approximately40 sends, not measurements of our current phone) report about83ms
per text upgrade,165ms per rebuild and185ms per maximum-size image. Four such
images imply roughly740ms by that older model before other work. These are
host-call timings, not guaranteed on-glass latency. His recommendation is to
reduce call count; shrinking/compressing pictures alone is insufficient.

## Implication

A compact custom menu built from native text containers can offer denser rows
than the stock native ListContainerProperty while transferring only text. One
multiline text update per selection is a plausible fast layout; avoid one call
per row and avoid per-frame full-screen image queues. Actual line fit and latency
must be tested on the current G2. This is a design option, not a claim about
Books source or a verified reproduction of its performance.

Current1.0.11 remains the user's requested native list, without session-list
images/animation. Keep that until a separate change is authorized. No contact
with Nick, authentication into his accounts, benchmark inference or beta upload.
