# Even SDK feature requests
Updated: 2026-11-03

Historical project requests, based on installed SDK0.0.16 investigations. This is
not a fresh audit of a newer SDK. User has Discord open; no agent message/ticket sent.

1. Native reader scroll controls: scroll down/page down/end/latest, read and restore
   scroll offset, and append/update content without resetting the user's position.
2. Native voice/transcription foreground panel like Terminal/Even AI, with opaque
   background, show/hide/update without rebuilding the underlying conversation,
   and independent draft scrolling/focus. Border/z-order alone is not optical depth.
3. Native transcription access: obtain device/phone STT partial/final text, language
   and completion/cancel events rather than only raw microphone PCM.
4. Contextual-menu navigation: supported submenus or programmatic open/replace so
   selecting Filter by Agent can open native agent choices without a second Menu press.
5. Native text layout controls: compact font/line height, explicit alignment and
   documented glyph coverage consistent between simulator and G2. Native dots now
   replace Braille image markers in our session list; no claim about Terminal internals.
6. Optional scrollbar visibility: newly raised request to hide the thick native
   reader scrollbar while retaining smooth scrolling. Exact reported bar location
   still awaiting user confirmation.

Prioritize scroll preservation/controls and native voice panel. User previously
said not to submit SDK tickets; preparing this list does not authorize sending one.
