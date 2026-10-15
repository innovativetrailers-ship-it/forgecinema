# Run 46 — Desktop 3.0.6 click-test fixes (do not stop until every item is done and re-tested in the packaged app)

Source: live click test of `dist/installers/mac-arm64/Cinematic Forge.app` (3.0.6), signed in, maximised 1456x819, blank project. Rules: INV-4 honest UI, INV-5 no swallowed errors, INV-8 web/desktop parity. No generation, no credit spend while testing. Test by running the PACKAGED app (`open -n`), not dev mode.

## Results so far
| ID | Result |
|----|--------|
| I6 Output window | PASS (framed window, Escape closes, "Fullscreen output on second display" notice) |
| I10 Media Bin Import mp4 | PASS (thumbnail appears) |
| I2/I3 drag clip to timeline | **FAIL, BLOCKER** — dragging the imported clip from the Media Bin onto the first lane replaces the whole editor with "Something went wrong — Reload this panel". Reload button does nothing (stays on the error). Only Cmd+R recovers (returns to launcher). |
| I5 error boundary | **FAIL** — boundary sits at the app root, so one panel's crash blanks the entire editor; "Reload this panel" does not re-mount anything. |
| I7 menu bar | **FAIL** — File has only Close Window / Close All / Quit. No New Project, Open, Import, Save, Export. Help has only "Account". |
| I9 resize/layout | **FAIL** — Inspector clipped at right edge (text cut, LOCAL MODELS fields cut off); timeline track headers jammed, automation buttons (Vol Pan Dim Wid…) overlap, only ~4 tracks visible; at smaller sizes Program monitor and top-bar account text clip. |
| I4 export empty timeline | **FAIL** — Export & Delivery dialog's Export button on an empty timeline just closes the dialog; no "Add a clip first" message (INV-4). |
| I8 buttons | **FAIL (one found)** — Character Studio "+ New character" does nothing visible (no entry, no message, not disabled). Rest of I8 not reached because of the crash. |
| I11, I7 Help→Account, export of a real clip, playback | NOT REACHED (blocked by the drop crash) |

## Fixes
1. **Drop crash (first, blocker).** Reproduce: import mp4, drag thumbnail to lane 1. Get the real stack from the renderer (DevTools or main-process log of the packaged build), fix the root cause, and add a unit/e2e test that drops an imported clip onto an empty timeline and asserts a clip appears and the app does not unmount. Show the stack and the fix in your report.
2. **Error boundaries per panel** (Media Bin, Source, Program, Inspector, Timeline, each modal). A crash shows the message inside that panel only; "Reload this panel" re-mounts that panel and clears its error state. Log the error (no swallowing). Add a test that throws in one panel and checks the others stay up.
3. **Native menu parity.** File: New Project, Open Project…, Import Media…, Save, Export…, Close Window, Quit. Help: Account (opens browser), Documentation, About. Each item must do the same thing as the matching in-app control, or be disabled with a reason. Test each in the packaged app.
4. **Layout at 1280x720 and 1456x819.** Inspector scrolls inside its column and is never wider than the window; track headers have a minimum width, automation buttons wrap or move into a menu rather than overlap; at least 6 tracks visible or the timeline scrolls vertically; top bar truncates the account email with ellipsis. Screenshot both sizes into `docs/screens/`.
5. **Export on empty timeline** shows "Add a clip first" inline in the dialog and keeps it open. With a clip, Export opens the save dialog, shows progress, writes an mp4 that plays.
6. **+ New character** creates an entry in the list (named, selectable) or is disabled with a reason; same check for every other button in Character Studio, Shop, Mixer, Review.
7. **Stale release markers.** Delete or regenerate `dist/installers/desktop-release-manifest.json`, `latest-mac.yml`, `mac-notarized.txt` on every build; the release job must refuse a marker whose version does not match package.json (3.0.5 markers dated Oct 11 are still there).
8. Rebuild 3.0.6 → if any code changed, bump to **3.0.7**, rerun the Mach-O arch gate (must inspect >0 binaries), update `docs/DESKTOP-CLICK-TEST.md` with PASS/FAIL per row and what you actually clicked.

## Report back
For each numbered item: what changed, the test that proves it, and the packaged-app result. Do not mark anything done from dev mode only. Signing/notarisation stays with Neo (keychain Always Allow + `notarytool store-credentials`); downloads stay closed.
