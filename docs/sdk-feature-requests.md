# Even SDK feature requests
Updated: 2026-11-03

## Current priorities and submission route

2026-11-03 user narrows the main requests to these two; other ideas below are
background, not the current feature-request scope:

1. Native near-field framed popup menus/custom content, shown and dismissed without
   rebuilding the underlying reader or losing its scroll position.
2. Native text scroll-to-bottom/auto-follow for newest live LLM output; pause when
   reading older text and resume when returning to the bottom.

Read-only search of user's logged-in Even Realities Discord on2026-11-03:
- even-hub-help is a forum, not a text channel. Individual request posts get threads:
  https://discord.com/channels/1301124787740868620/1484753075590664332
- Existing SDK authentication feature-request thread by Dale H links a GitHub issue
  "to track this on github":
  https://discord.com/channels/1301124787740868620/1484753075590664332/threads/1536380592369705010
  https://github.com/even-realities/everything-evenhub/issues/25
- Official repo has other SDK feature-request issues:
  https://github.com/even-realities/everything-evenhub/issues
- Server search for scroll found Oden's Oct31 thread "Things that would make a great
  difference", describing list scroll events, multi-row scrolling, selection on
  rebuild, scroll deltas and event sources. Related, not the exact auto-follow ask.
- Popup and near-field searches did not identify an exact equivalent in inspected
  results. Search was bounded, not an exhaustive duplicate audit. No promise of
  maintainer response or official required filing route was found.
- Recommended route: separate forum posts for the two requests; GitHub issues for
  durable tracking, cross-linked in Discord. This is a recommendation based on the
  observed precedent, not an official submission rule. No message/issue was sent.

## Earlier ideas


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
