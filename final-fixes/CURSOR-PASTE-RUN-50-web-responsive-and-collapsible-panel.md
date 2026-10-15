# Run 50 — Web: responsive layout, collapsible Generate panel in Ultimate, Generate button covered (do not stop until all done and verified live)

Source: live test of https://forgecinema.vercel.app signed in (internal account), built-in browser with viewport emulation at 1920x1080, 1440x900, 1280x720, 1024x768, 768x1024, 390x844, plus a DOM probe (elements outside the viewport, element under the centre of the Generate button). Rules: INV-4 honest UI, INV-8 web/desktop parity. No generation, no credit spend while testing.

## Measured results (Ultimate `/ultimate` unless stated)
| Viewport | Result |
|---|---|
| 1920x1080 | Layout fits. **Generate button is covered by the floating "Request a feature" button** (its centre point hits "Request a feature"). |
| 1440x900 | Same cover bug. Top bar: Download, a bell/icon button and "Text" tool button sit past the right edge (x 1349-1498 on a 1440 viewport). |
| 1280x720 | Cover bug. Off-screen with no scroll: Export Film, Download, icon button, and timeline tools Select, Razor, Repaint, Motion Brush, Text. Page has overflow hidden, so they are unreachable. |
| 1024x768 | Cover bug. Off-screen: DEV, Share, Export Film, Download, Motion & Camera, Review tabs, all timeline tools (12 elements). Program monitor shrinks to 252x142. |
| 768x1024 | Cover bug. 18 elements off-screen incl. Studio/Blockbuster, Share, Export Film, Download, Audio Mix, Green Screen, SFX Makeup, CGI. Program monitor 185x104. The Generate panel plus icon rail takes about 315 px of 768. |
| 390x844 | Ultimate is unusable: Generate panel takes about 300 px of 390, Program monitor/transport text overlaps (timecode over the play button), inspector buttons wrap into a narrow column. |
| 390x844 `/simple` | Prompt box, Quality cards ("Film G…") and the Generate Video button run past the right edge and are cut off; 21 elements outside the viewport; no horizontal scroll to reach them. |

## Fixes
1. **"Request a feature" must never cover controls.** Move it out of the Generate button area: dock it to a fixed corner that is clear of the left panel (e.g. bottom-right above the timeline, or into the help/account menu on small screens), with a safe-area-aware offset. Test: at every viewport above, `elementFromPoint` at the Generate button's centre returns the Generate button.
2. **Collapsible left panel in Ultimate (Neo's request).** The Generate side panel gets a close control: a chevron button on the panel's right edge (and keyboard shortcut `[`) slides the panel closed (transform + width transition, about 200 ms), leaving only the icon rail. A matching open control (chevron on the rail, tooltip "Open panel", same shortcut) slides it back. The Program monitor and timeline expand to use the freed width, and the monitor re-letterboxes. State persists per user (localStorage with try/catch, default open on wide screens, default closed below 1100 px). Respect `prefers-reduced-motion`. The panel's own X button keeps working and uses the same state. Test: closed and open at 1920, 1280, 1024; the monitor width grows by the panel width when closed.
3. **Top bar never clips.** Under about 1500 px, collapse low-priority items (DEV badge, Share, Download, icon buttons) into an overflow "..." menu; Export Film stays visible and is the last thing to collapse. The mode tabs (Simple, Advanced, Ultimate, Download) collapse into a select under 700 px. Nothing may sit past the viewport edge without a scroll or an overflow menu.
4. **Ultimate secondary tab strip and timeline tool row** (Script ... Review, and Select/Razor/Repaint/Motion Brush/Text): horizontally scrollable with edge fade and left/right arrows, or wrap, so every item is reachable at 1024 and 768. Currently clipped with no way to reach them.
5. **Monitor and timeline minimums.** Program monitor never below 40% of the viewport width; below 1100 px the Generate panel auto-collapses (see 2) instead of squeezing the monitor to 185 px. Timeline gets horizontal scroll, never clipped.
6. **Phones (< 700 px).** Ultimate: show a single-column stacked layout (monitor on top, then a bottom sheet for Generate), or if that is too large, show a clear message with a link to Simple ("Ultimate needs a wider screen. Open Simple mode") instead of a broken editor. Simple at 390: the page must fit the width, prompt box, Quality cards (2-column grid), Duration/Aspect chips (wrap) and the Generate button full width inside the viewport. Remove `overflow-x: hidden` as a way of hiding broken layouts; fix the cause.
7. **Advanced mode** (`/advanced`): run the same six viewports and fix anything found by the same probe.

## Proof required (live, after deploy)
- Re-run the probe at 1920x1080, 1440x900, 1280x720, 1024x768, 768x1024, 390x844 for `/simple`, `/advanced`, `/ultimate`: zero elements outside the viewport that are not inside a scroll container or overflow menu, Generate button not covered, panel closes and reopens.
- A Playwright test file with these viewports and assertions (bounding boxes, `elementFromPoint`, panel width change), committed.
- Screenshots of each viewport for each mode in `docs/screens/responsive/`.
- Report per item and per viewport. Do not mark anything done from reading code.
