# Even Hub listing — Orca Glass
Updated: 2026-11-03

## Profile

- Package ID: `com.eugene8080.orcaglass`
- App name: **Orca Glass**
- Tagline: **Read your coding sessions. Speak your next step.**
- Description: [exact portal text](description.txt), under 2,000 characters.
- Windows source/setup: https://github.com/eugene8080/orca-glass/tree/windows-android-codex
- Chosen creator: Quiet Signal (Personal Information now complete in portal).
- Language: English.
- Attribution: based on 2ero20ne's MIT-licensed Orca Glass. The upstream developer name, privacy URL and Mac-only instructions do not describe this fork.
- Chosen public developer: Quiet Signal; support: quietsignal.apps@gmail.com.
  User entered phone/address directly; do not copy those values into this repository.
  The generated policy PDF includes those details and is accessible by its CDN URL
  without signing in. Do not commit that original PDF or its URL to the repository.

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

## Screenshots

Official native simulator captures using the unchanged 1.0.21 app renderer and fictional data. The list includes Cursor, Pi, Claude, Codex and OpenCode at the user's request; the reader/voice example is Codex. List discovery does not establish reader compatibility for every provider. All glasses images are 576 × 288. No real conversations, credentials, account usage or microphone audio appear. These are simulator captures, not G2 photographs.

| Order | Image | Content |
| --- | --- | --- |
| 1 | [Sessions](screenshots/1-threads.png) | Names, activity, provider labels and filter |
| 2 | [Conversation](screenshots/2-answer.png) | Native reader and waiting status |
| 3 | [Voice review](screenshots/3-reply.png) | Transcription below the preserved conversation |
| 4 | [Usage](screenshots/4-usage.png) | Example allowance usage |
| 5 | [New session](screenshots/5-new-session.png) | Workspace picker |
| 6 | [Actions](screenshots/6-actions.png) | Refresh sessions, New Session and Usage |

Untouched RGBA exports are in [screenshots/native](screenshots/native). The linked RGB copies composite the same pixels onto black for ordinary image viewers. No text, layout or content was retouched. The simulator omits OS contextual entries; image 6 is supplemental and does not represent the complete hardware menu.

Open [the gallery](gallery.html) to review. `store/works-eyecatch.png` and `store/screenshots/phone-setup.png` are historical upstream assets, excluded from this release set.

## Capture again

Use named PowerShell terminals in this repo's Orca workspace; reuse or close confirmed old preview processes first.

1. Run `node scripts/store-preview.mjs` (loopback 8792).
2. Run `app/node_modules/@evenrealities/sim-win32-x64/bin/evenhub-simulator.exe` with URL `http://127.0.0.1:8792/?code=demo&lang=en` and `--automation-port 9899`.
3. Starting at the fresh session list, run:

```powershell
node scripts/store-capture.mjs 1-threads
node scripts/store-capture.mjs 2-answer down down down down click
node scripts/store-capture.mjs 3-reply long_press long_press_release
node scripts/store-capture.mjs 6-actions double_click double_click context_menu
node scripts/store-capture.mjs 4-usage down down click
node scripts/store-capture.mjs 5-new-session double_click context_menu down click
python scripts/store-previews.py
```

The Python step requires Pillow. Verify each image visually. The fixture replaces data and microphone capture only; native rendering/gestures use the real app and SDK. Send and Launch are disabled. Leave the simulator open for review.

## Public release preparation

- **General-user connection:** `scripts/build-beta.mjs` pins the build to the single PC origin allowed by `app/app.json`. Arbitrary users cannot pair their PCs with this installed build. Resolve public connection/setup before advertising a self-service install.
- **Privacy:** corrected policy prepared above; replace inaccurate generated attachment before submission. Portal custom upload method not found. The original generated attachment includes phone/address and remains retrievable; replacing it must not be assumed to remove old CDN copies.
- **Developer information:** Quiet Signal/contact setup complete after user entered phone/address. The user-selected [GIMP icon](icon/orca-glass-icon.png) is saved and visually verified in the portal. Icon preparation is complete.
- **Description checklist:** completed by setting the missing category to AI. Existing description text retained.
- **Name consistency:** manifest/portal say `Orca Glass`; on-glasses header says `Orca-glass`. Align in a later build before submission.
- **Hardware:** retain open 1.0.21 checks in [TODOS.md](../TODOS.md). Final-only assistant filtering is not implemented; do not promise it.

[Even submission guidelines](https://hub.evenrealities.com/docs/ship/app-submission) require complete developer/permission information, foreground/background artwork, a legible icon and accurate simulator screenshots. Public review and publication happen in the portal. This task prepares the profile and assets; it does not submit or publish the application.
