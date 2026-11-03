# Session reader
Updated: 2026-11-02

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
