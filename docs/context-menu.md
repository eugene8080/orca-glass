# Native contextual menu
Updated: 2026-11-02

## Open regression report

2026-11-02 user supplied Windows simulator screenshots showing only View options
and reported that Display off/Brightness/Close existed before1.0.6. Asked whether
the controls are also missing on physical G2; not yet answered.1.0.5 had no
menuObject;1.0.6 declares only View options, following the documented additive
contract. The discrepancy remains unresolved. Do not claim the complete native
menu was simulator-verified, assume hardware retention from the docs, or add
nonfunctional copies of OS controls. No new beta/code change for this report yet.

## Implementation

Beta1.0.6 adds one first-level OS menu action, `View options >`, only to the
sessions-list page. Every session/reader/voice/other page omits menuObject, which
clears custom entries while preserving permanent OS controls.

Selecting View options closes the native overlay and opens an in-app list:

```text
<-
All Sessions ✓
Claude
Codex
[other providers represented in connected local Orca terminals]
```

Selection filters the existing session list and persists through SDK local
storage under view-provider. All Sessions is the default; ✓ marks the selected
option. A filter with no sessions shows zero sessions, not another provider's
sessions. Provider identity is Orca agentIdentity (for example OpenCode), not an
invented inference about which underlying model it uses. No provider is launched
or sent input by viewing/selecting a filter. New-session launch restrictions are
unchanged. Long provider rosters paginate instead of silently dropping options.

## OS-owned behavior and limits

The SDK exposes only custom first-level action labels/IDs. Display off, Brightness
and Close are permanent system slots, absent from the custom menu definition.
Display off uses real OS display-off behavior; Brightness uses the G2's native
brightness bar. We do not simulate these with blank pages or textColor changes.
Close is native exit. Its row/order/exit toast cannot be set through SDK0.0.16.
The exact requested Display off / View options / Brightness / Close ordering and
literal Orca Glass CLosed text therefore cannot be guaranteed by this plugin.
App display name was changed from Orca Glass Windows to Orca Glass in both
manifest and unpublished portal listing, so native naming uses Orca Glass.

Foreground enter/exit from opening/dismissing Menu is not app exit. The existing
reader and polling remain mounted; stale View options events inside a session
are ignored. Real SYSTEM_EXIT/ABNORMAL_EXIT cleanup remains unchanged.

## Verification

-56 tests, TypeScript/Vite build and doctor pass. Tests cover menu scoping,
  system-overlay events, discovered providers, persistence, check label,
  zero-match filter and restoring All Sessions, without real provider input.
- Official simulator0.9.5, desktop session1, Vite5173 demo mode: context_menu
  displays View options >; selecting it opens filter page. Codex selection
  visibly reduces list to one synthetic Codex session. Its reader has no custom
  View options entry when Menu is opened. Native-menu animations need about
  650ms to settle before screenshots. Screenshots under ignored .local/menu-*.
- Simulator draws only custom entries, not permanent firmware system slots.
  Thus native display-off, brightness bar, Close toast/order and ✓ glyph
  appearance remain G2 checks; payload checkmark is covered by app tests.
- Uploaded/promoted beta1.0.6 (46,466 bytes); beta channel verified. No public
  marketplace publication, real inference, Claude interaction or firmware change.

Reference: [official contextual-menu contract](https://hub.evenrealities.com/docs/build/contextual-menu).
