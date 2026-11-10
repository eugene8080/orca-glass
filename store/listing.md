# Even Hub listing — Orca Glass
Updated: 2026-11-05

## Current status

2026-11-05 screenshot refresh: dedicated Eugene Chrome now confirms **public1.0.36
is Live** (no longer awaiting release review). Preserved the newer portal wording
"Orca + Hermes" in store/description.txt. Captured eight fresh native1.0.36 images
with fictional data; app tree unchanged from release d352cbf. All576x288 RGB upload
images verified pixel-identical to native RGBA composited on black. The previously
solid-green-looking captures are alpha-channel exports, not a screenshot failure.
Gallery refreshed. User explicitly takes over uploads; NEW SCREENSHOTS NOT SAVED
TO PORTAL by agent. Preview editor was opened and old images removed only in its
unsaved dialog; later Escape cancels that edit. User should replace the old set
with the eight files linked below. No Confirm/review submission/channel/bridge/app
change. Native store preview8792/9899 remains OPEN in named Orca tabs.

2026-11-05 later update: Eugene reports he submitted the release. Fresh read-only
portal inspection confirms candidate **v1.0.36 — In review**, **Review in progress**,
**Submitted**, and **Awaiting review**. Public remains1.0.23; this is submission,
not approval or publication of1.0.36. Description remains the saved1.0.36 text.
The privacy attachment was not reopened or replaced during this status check;
the inspection below is the last verified attachment state. No agent submission,
app/bridge/beta change or external message. Wait for Even Hub's review outcome.

2026-11-05: public-release preparation now completed in dedicated Eugene Chrome
(window10228026), reached through Orca computer-use after browser connector error.
Saved the exact1,630-character store/description.txt through Description > Edit >
Confirm. Reload readback matches the source after whitespace normalization; the
configured-private-PC/Tailscale and non-self-service limitation remains explicit.
Selected v1.0.36 through Publish to hub > Select build > Confirm. Portal now shows
v1.0.36 as the candidate and Submit for review. FINAL SUBMIT NOT CLICKED: Eugene
explicitly requires confirmation after the description/privacy recheck.
Read-only CLI confirms1.0.36 on beta,51,971bytes; public remains1.0.23.

Opened the CURRENT attached PDF through its portal attachment button. Chrome's
PDF viewer exposes three pages, effective November4,2026. It is the generated
policy, not store/Orca-Glass-Privacy-and-Terms.pdf. Header says AI Used: No and
Location Tracked: No; lists glasses microphone/local-network permissions and no
third-party services. Specific collection categories and sharing paragraph are
absent, but template still describes developer collection/retention, uninstall
stopping collection, safeguards, and deletion of children's data from our servers.
Phone/address appear in header and contact sections (values/attachment URL not
copied here). Terms cover lawful use/account responsibility, prohibit reverse
engineering/bypassing restrictions, claim developer/licensor ownership, disclaim
warranties and indirect liability, and permit changed terms. These points still
conflict with the documented user-controlled processing/MIT model. Corrected repo
PDF remains unattached; no policy replacement or contact/profile edit performed.

Waiting on Eugene's explicit choice to submit1.0.36 with this attachment or hold
for corrected policy. No review submitted, public publication, beta change,
app/bridge edit, or message to anyone. Source description unchanged. Screenshots
and full browser trees remain ignored local evidence only; do not commit the
original PDF, its CDN URL or personal phone/address.

2026-11-04 later release: beta **1.0.28** promoted and CLI channel verified;
public remains1.0.23. Hermes support is now in beta. The portal description below
was saved for1.0.27 and was not edited during the1.0.28 release.

2026-11-04: authenticated portal confirms **public1.0.23 is live**, latest beta
**1.0.27**. The user requested a README/description refresh. Saved the1535-character
[description](description.txt) through Store listing > Description > Edit > Confirm
in dedicated Eugene Chrome, then reloaded to confirm persistence. Newer controls
are explicitly beta-only; Hermes is development-only. No build promotion or
review submission. Existing tagline remains **Read your Orca sessions. Speak your
next step.** Repository README updated to the same release status. Screenshot
proof is ignored local `.local/evenhub-readme-updated.png`.

The dated preparation/attachment observations below are historical. They do not
establish the current attachment's contents or a current publication blocker;
no privacy PDF was opened or changed during this README-only update. The private
PC origin/self-service limitation remains in the current manifest and description.

## Profile

- Package ID: `com.eugene8080.orcaglass`
- App name: **Orca Glass**
- Tagline: **Read your Orca sessions. Speak your next step.**
- Description: [exact portal text](description.txt), under 2,000 characters.
- Windows source/setup: https://github.com/eugene8080/orca-glass/tree/windows-android-codex
- Chosen creator: Quiet Signal (Personal Information now complete in portal).
- Language: English.
- Attribution: based on 2ero20ne's MIT-licensed Orca Glass. The upstream developer name, privacy URL and Mac-only instructions do not describe this fork.
- Chosen public developer: Quiet Signal; support: quietsignal.apps@gmail.com.
  User entered phone/address directly; do not copy those values into this repository.
  The generated policy PDF includes those details and is accessible by its CDN URL
  without signing in. Do not commit that original PDF or its URL to the repository.

Selected icon assets: [24x24 PNG](icon/orca-glass-icon.png) and
[matching editable GIMP source](icon/orca-glass-icon.xcf). These are the only files
retained in store/icon at user request; earlier design studies remain in Git
history. PNG validation passed: transparent or opaque #F4F4F4 pixels, aligned 2x2
blocks, under 1 MB. Gallery enlarges this exact PNG with nearest-neighbour display.

Privacy status, 2026-11-03: portal generator completed and auto-attached a PDF;
all six checklist items now show complete. Its template incorrectly describes
developer collection/retention/sharing and embeds the entered phone/address.
User clarifies app traffic stays with their own PC bridge and service accounts;
Quiet Signal does not receive or share normal app data.

Corrected [two-page PDF](Orca-Glass-Privacy-and-Terms.pdf) and
[editable text](privacy-and-terms.md) prepared and visually/text verified.
It distinguishes user-controlled processing from developer collection, covers
voluntary support emails separately, preserves MIT rights, and omits phone/address.
Rebuild with `python scripts/render-store-policy.py` (requires reportlab).
**Portal replacement remains pending:** the inspected Edit workflow only offers
the same generator, not custom upload. Do not submit the currently attached
generated document. No review/publication performed; no support message sent.

User approved the corrected PDF and requested review submission on 2026-11-03.
Fresh portal reload and attachment-open verified the exact original generated PDF
is still attached. Current beta1.0.22 manifest/build still pins the private PC
origin. Submission remains held for these two concrete blockers; PDF approval
does not need to be requested again.

Regenerated-PDF check, 2026-11-03: user supplied a new three-page generated file
for review. Clearing optional data/service rows removes the specific collection
categories and sharing paragraph, but unchecked AI produces literal `AI Used: No`.
Fixed template still claims developer retention, deletion from our servers and
uninstall stopping collection, and includes phone/address plus a blanket reverse-
engineering prohibition. Not suitable as a substitute for the approved custom
policy. All three pages visually reviewed; source kept outside Git. Portal
attachment state was not rechecked during this local-file review.

Phone visibility check, 2026-11-03: the portal requires telephone but explicitly
labels only email as public. [Developer terms, section 3.1](https://support.evenrealities.com/hc/en-us/articles/15606676690703-Even-Hub-Developer-Platform-Terms-of-Service)
allow display of developer contact details without identifying individual fields.
The inspected [OcuClaw public web listing](https://hub.evenrealities.com/catalogue/com.akelu.ocuclaw)
shows developer name but no phone/contact section. This does not establish what
the mobile app shows or whether the phone remains private. No definitive phone
visibility rule was found at that stage. The later generated PDF confirms that
the generator embeds both phone and address in a publicly retrievable document.

Name, tagline and description saved through the authenticated Even Hub CLI on 2026-11-03. Five primary screenshots and the portal's Office environment cover were saved through the browser; the sixth contextual-menu image remains supplemental/local. User requests preview before Publish: do not submit for review or publish without approval. Beta remains 1.0.21; no build uploaded or submitted for public review.

The description and README credit the original author and link the upstream project. Root `LICENSE` retains `Copyright (c) 2026 2ero20ne` and the full MIT text. `app/vite.config.ts` now emits `LICENSE.txt` and `ATTRIBUTION.txt` in production builds; the built license was checked byte-for-byte against the original. This packaging change is not yet in beta1.0.21; include it in the next release candidate.

## Listing refresh, 2026-11-10 (beta 1.0.49)

Agent: Claude Sonnet 5.5, continuing a stopped Cursor agent's uncommitted work (brief:
`docs/store-listing-task.md`). Eugene pastes the description and uploads the images in the
portal himself; no agent opened the portal or a browser.

- Description: `store/description.txt`, 1,975 characters (portal limit 2,000, see above).
  Covers agents with models, reader, small pixel fonts, filters, usage, voice, English and
  Japanese, Windows and macOS (macOS stated as not yet verified on a real Mac). The
  Cursor draft was kept after a fact check against the code and `CLAUDE.md`.
- Japanese: `store/description.ja.txt`, 1,095 characters. **Not reviewed by a native
  speaker.** Machine-written from the English text; have a Japanese reader check it.
- Upload PNGs (576x288, opaque, in `store/screenshots/`; transparent originals in `native/`):

| File | Shows |
| --- | --- |
| `1-threads.png` | Session list: Cursor, Pi, Claude, Codex, OpenCode, OpenClaude, workspace/agent labels |
| `2-answer.png` | Reader, native text, model and status row (OpenClaude, GPT-5.6 Sol high) |
| `10-small-text.png` | Reader in Terminus 6x12: aligned Markdown table, hanging indents |
| `11-compare-fonts.png` | Compare fonts: all six pixel fonts, Departure at both sizes |
| `3-reply.png` | Voice review (fictional transcript, tap to send) |
| `12-choices.png` | Numbered choices with question (Claude, Opus 5.5) |
| `7-agent-filter.png` | Filter by Agent, with Hermes Agent |
| `5-workspaces.png` | Filter by Workspace, Recent and Other workspaces |
| `4-usage.png` | Usage, Computer-time reset mode |
| `8-hermes-workspaces.png` | Hermes Bots / Sessions / Scheduled jobs |
| `9-hermes-sessions.png` | Hermes session list |
| `13-japanese.png` | Session list with the interface language set to Japanese |
| `14-departure-dense.png` | Full 24-row reader page in Departure 7x11 (80 columns): text density showcase. Rendered offline with the app's own renderer (`app/src/fine-text.ts`), fictional content, 2026-11-10 |
| `phone-companion.png` | Phone companion page (420x900, headless localhost capture of the phone preview with its own demo data; not a glasses capture) |

- Removed: `6-actions.png` (the simulator omits the G2 system entries, so it was never accurate).
  The README table and `store/gallery.html` now list this set.
- Not produced: a real-device photo; a Japanese reader screen in Shinonome (the fixture
  conversations are English only); Thinking indicator and the Departure-only shots.
- Not verified: how the portal accepts 12 images (earlier sets used 8); the Japanese text
  reading; the phone page on a real phone; macOS on a real Mac.
- Capture recipe: start `node scripts/store-preview.mjs` (8792) and the simulator on
  `http://127.0.0.1:8792/?code=demo&lang=en` with `--automation-port 9899` in named Orca
  tabs, run `node scripts/store-capture-all.mjs`, then `python scripts/store-previews.py`.
  For `13-japanese` restart the simulator with `&lang=ja` and run
  `node scripts/store-capture.mjs 13-japanese`, then restart it with `&lang=en`.
  The fixture seeds the stored language from `?lang=`.
- Pitfall: the simulator capture holds solid green in RGB; the text is in alpha. A fully
  transparent capture means the app exited (two double-clicks from the session list), not
  that the capture tool is broken. Restart the simulator.

## Screenshots — 1.0.36 (superseded by the refresh above)

Eight current upload files, using the real native app renderer and fictional data.
No real chats, account usage, credentials or microphone audio. Not G2 photographs.

| Order | Upload PNG |
| --- | --- |
| 1 | [Orca session list](screenshots/1-threads.png) |
| 2 | [Nine-row reader](screenshots/2-answer.png) |
| 3 | [Full-screen voice review](screenshots/3-reply.png) |
| 4 | [Codex/Claude/Cursor usage](screenshots/4-usage.png) |
| 5 | [Orca workspace filter](screenshots/5-workspaces.png) |
| 6 | [Separate agent filter](screenshots/7-agent-filter.png) |
| 7 | [Hermes workspace groups](screenshots/8-hermes-workspaces.png) |
| 8 | [Hermes session list](screenshots/9-hermes-sessions.png) |

Upload the opaque RGB PNGs in store/screenshots, not the transparent files in
store/screenshots/native. Original RGBA captures are retained unchanged; the upload
copies only composite alpha onto black. Supplemental6-actions is not one of these
eight: the simulator omits G2 system contextual entries. Gallery: [review](gallery.html).
User performs portal upload; confirmation of the persisted new set remains pending.

## Capture again

Run scripts/store-preview.mjs in a named Orca pwsh terminal (8792), then the native
simulator on9899 against http://127.0.0.1:8792/?code=demo&lang=en. The real app is
unchanged; fixture replaces API/audio only and disables Send/Launch. Use
scripts/store-capture.mjs with names above, then python scripts/store-previews.py
to composite alpha. Inspect every image. Existing named store preview is left OPEN.

## Public release preparation

- **General-user connection:** `scripts/build-beta.mjs` pins the build to the single PC origin allowed by `app/app.json`. Arbitrary users cannot pair their PCs with this installed build. Resolve public connection/setup before advertising a self-service install.
- **Privacy:** corrected policy prepared above; replace inaccurate generated attachment before submission. Portal custom upload method not found. The original generated attachment includes phone/address and remains retrievable; replacing it must not be assumed to remove old CDN copies.
- **Developer information:** Quiet Signal/contact setup complete after user entered phone/address. The user-selected [GIMP icon](icon/orca-glass-icon.png) is saved and visually verified in the portal. Icon preparation is complete.
- **Description checklist:** completed by setting the missing category to AI. Existing description text retained.
- **Name consistency:** manifest/portal say `Orca Glass`; on-glasses header says `Orca-glass`. Align in a later build before submission.
- **Hardware:** retain open 1.0.21 checks in [TODOS.md](../TODOS.md). Final-only assistant filtering is not implemented; do not promise it.

[Even submission guidelines](https://hub.evenrealities.com/docs/ship/app-submission) require complete developer/permission information, foreground/background artwork, a legible icon and accurate simulator screenshots. Public review and publication happen in the portal. This task prepares the profile and assets; it does not submit or publish the application.
