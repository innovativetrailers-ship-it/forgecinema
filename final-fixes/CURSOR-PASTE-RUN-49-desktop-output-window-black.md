# Run 49 — Desktop 3.0.9: Output window is black (do not stop until fixed and re-tested in the PACKAGED app)

Source: my live click test of packaged unsigned 3.0.9 (display-scope clicks, real pixels). Everything else tested passes (monitors, playback, track headers, Preferences, Documentation link, export). Do not touch those. Rules: INV-4 honest UI, INV-5 no swallowed errors.

## Defect
Project with a clip on the timeline, Program monitor showing the clip frame. Click **Output** (Program transport row): a framed window opens, Escape closes it and shows "Fullscreen output on second display", but the Output window is 100% black. I tried with the playhead mid-clip and past the clip end; both black. The Program monitor shows the picture correctly at the same time.

## Fix
1. Find why the Output window gets no frames (not subscribed to the program frame stream, video element hidden/not decoding, wrong source URL/protocol in the second BrowserWindow, canvas not drawn, IPC channel missing). Fix at the root; the Output window must show exactly what Program shows, updating as the playhead moves and during playback, letterboxed inside its window.
2. If there is genuinely nothing to show (no clip at playhead), show a clear "No signal" label instead of pure black (INV-4).
3. Log any failure to the main-process log; no swallowed errors.
4. Test in the packaged app: load clip, open Output, sample pixels of the Output window (capture the window or read the canvas) and assert they match the Program frame (non-black, same dominant colours); press Play and assert the Output frame changes over 2 s; Escape closes it. Save a screenshot to `docs/screens/output-window.png`.

## Two small items (same pass)
5. Preferences → API Keys still lists "Runway — Gen-4 camera control". Runway was removed from pickers: either remove the row or label it "Retired" like Replicate and xAI, consistently.
6. Preferences → Commerce → "Forge Cloud embeds" shows the status text "Checking the account" with no outcome. Show a real result (signed in as X / not linked / unreachable) or remove the line.

## Not verified by me, so please prove in the packaged app
Generate-from-Script dialog stays one size and every field works. Report where it is opened from.

## Report back
Per item: what changed, the test that proves it, packaged-app result, screenshot paths. Bump to 3.0.10 if code changes, rerun the Mach-O gate (inspected > 0). Signing/notarisation stays with Neo. Downloads stay closed.
