# Session reader
Updated: 2026-11-02

Six-row trial, not released: user requested a larger review box while preserving
background scroll. Official native simulator showed that enlarging the foreground
image over chat masks it and clearing those tiles leaves black regions. Moving
tiles behind chat avoids that artifact but native voice text overlaps chat.
Brightness-only body upgrades did not dim it in the tested simulator. A partial
one-character update did trigger the brightness change but replaced body content
and lost the position. Pixel checks failed. All experimental source was reverted;
ordinary1.0.9 build restored. No new beta was uploaded. A layout decision is
pending: current chat with small voice box, or six voice rows reserved at session
creation with only about1–2 native chat rows left visible.

User explicitly retains the existing contextual menu and declines Click page
advance after its difference from native scrolling was explained. Click remains
no-op. Do not implement app-managed Click paging from the earlier request alone.

Version1.0.9 voice trial: two precreated280x64 image tiles draw a border around
the reserved footer at x8/y220, total560x64. They sit behind voice text, within
the four-image limit. Border uploads share the serialized panel queue and clear
on dismissal. The body is neither rebuilt nor rewritten throughout recording,
transcription, review and cancellation. Successful send resumes normal polling.
This is an app-drawn footer overlay, not native optical near-field depth; swipes
remain with native chat.59 tests/build pass. Official isolated simulator checks
with fake audio show no rebuild/body writes, one complete fake send and identical
chat text pixels through review/cancel/send. Scrollbar fading changes only its
own pixels; no real agent input or Claude interaction occurred.

Sequential native menus: replacing menuObject changes the next menu registration
but does not open it. There is no public open-menu command, and system entries
cannot be removed. A second Menu gesture is required. Native Page Down, End and
scroll-down commands likewise are not exposed. Session click remains unchanged;
no content replacement workaround was introduced. These reader changes share
state/rendering and are maintained in one worktree rather than three.

User confirms Filter by Agent works on G2, with Pi and Cursor visible alongside
Claude and Codex. Dynamic provider discovery and filtering are hardware-confirmed;
this report does not establish conversation parsing or near-field submenu depth.

User confirms the terminal spacing repair on G2: no more `restartedor`.
The row-boundary spacing fix is hardware-confirmed.

Hardware confirmation: user verified on G2 that session click does nothing,
the frame and divider are present, `/` appears before Waiting input, and
`[Tap & hold to input]` is visible. This confirms those four beta1.0.8 checks;
The user subsequently confirmed visible Braille spinner, animated thinking and
pondering labels, cycling . / .. / ... dots and response timer present on G2.
Exact five-second cadence and numerical timer accuracy were not explicitly
checked. User also confirmed the menu label Filter by Agent on G2. Voice flow remains
a separate check; near-field filter submenu behavior is not verified.

Version1.0.8: clicking the session reader does nothing, even if the terminal
contains numbered choices. Resume latest output/Earlier/Later/Back controls
are removed. Existing voice-review click-to-send and double-click navigation
remain. The idle slash is native text. Borders use level15 (white in the
simulator's documented firmware palette), width2; prior level1 was too dim on
G2. Filter menu/page label is now Filter by Agent.58 tests/build pass;
native simulator shows all three decorations and reader screenshots are pixel
identical before/after click. The four hardware checks above subsequently passed.

The reader has a solid outer frame and a divider above the reserved status/voice
area. User messages begin with `/`, assistant messages with `>`, with hanging
indentation and no spacer row between turns. Verified Codex transcripts supply
conversation messages only; reasoning/tool records are excluded. Terminal fallback
recognizes Codex/Claude role boundaries and excludes tool/status rows. Unknown
terminal formats display an unavailable notice rather than expose unfiltered
tools or reasoning. No live Claude interaction was performed.

Working status cycles the requested ten Braille patterns every200ms. Words rotate
every five seconds through Processing, Thinking, Pondering, Cooking, Computing,
Inferring, Burning Tokens; dots cycle one/two/three every500ms. The simulator font
omits Braille, so exact Unicode dot patterns are drawn as a20x28 Gray8 image.
The input hint uses a280x28 right-aligned raster at x280/y224.

Elapsed time appears immediately before `[Tap & hold to input]`, for example
`13m 32s [Tap & hold to input]`. The bridge extracts Codex's reported duration
from its current `Working (... • esc to interrupt)` terminal status. It returns
`elapsedSeconds` with the exact-pane activity response. The app formats this
value only: no timer starts on opening a conversation and no client clock
advances the displayed duration. Missing duration and non-working state hide it.
Other providers currently have no verified elapsed-time source.

Status and hint uploads are serialized with voice panel writes. Capture/review
owns the reserved bottom area; restoration does not rebuild or rewrite chat.
Native scrolling and existing pause/resume behavior remain.

Validation:62 tests, TypeScript/Vite build and doctor pass. Official simulator
automation9899 screenshots show frame/divider, visible spinner, changing words
and right-aligned13m32s fixture value remaining unchanged across animation.
Live bridge selected Codex session returned working with1282 seconds. Hardware
G2 rendering/voice checks remain pending; simulator screenshots are not proof of
hardware optical depth. Filter Agents retains its existing normal-distance page;
the SDK has no supported nested near-field submenu API.
