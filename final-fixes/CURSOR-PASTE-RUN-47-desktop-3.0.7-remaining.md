# Run 47 — Desktop 3.0.7 remaining defects (do not stop until all done and re-tested in the PACKAGED app)

Source: my click test of the packaged unsigned 3.0.7 (display-scope clicks, real pixels, window ~1456x819). Rules: INV-4 honest UI, INV-5 no swallowed errors, INV-8 web/desktop parity. Test packaged app with `open -n`, not dev mode. No credit spend. Version bump to 3.0.8 if code changes.

## Verified PASS in 3.0.7 (do not touch)
- Drop crash fixed: imported mp4 dragged onto timeline lands as a clip, app stays up, clip persists after leaving and reopening the project.
- File menu: New Project, Open Project…, Import Media…, Save, Export…, Close Window, Quit. Import Media… from menu works.
- Export with a clip: save sheet appears, writes `export.mp4` (3840x2160 h264 + aac, 7.46 s). Export range shows the clip length.
- Preferences General has no "Download Forge Extreme".

## FAIL — fix these
1. **Playback is dead (blocker).** Clip on lane 1 starting at 00:00:00:00, playhead at 0, press Play in the Program monitor: button switches to Pause, but timecode stays 00:00:00:00 for 3+ s and the monitor stays black. Clip should show frames and the playhead and timecode must advance. Also: clicking the clip in the Media Bin must load it into the Source monitor, and the Program monitor must show the frame at the playhead when stopped. Find why (video element not created, stale clock, file URL blocked by CSP/protocol, codec) and fix at the root. Add an e2e test in the packaged app: drop clip, press Play, assert timecode > 00:00:01:00 and a non-black frame (canvas/video pixel check).
2. **Timeline track headers still unreadable.** At 1456x819 the header column shows track names overlapping each other, circular slider knobs piled on top of each other, M/S/Ø/fx labels clipped, rows of different height jammed together. The "Lanes" disclosure did not fix it. Make each track header a fixed-height row (min 28 px) with: name (ellipsis), M, S, a single volume slider. Everything else (pan, width, automation lanes, sends) goes in the disclosure/menu. Header column width fixed (e.g. 160 px), resizable. The lane rows must line up exactly with the header rows. Screenshot at 1456x819 and 1280x720 into `docs/screens/`, and I will compare.
3. **Stale version string.** Preferences → General shows "Version 3.0.7" but "You are on Cinematic Forge 3.0.6." underneath. One source of truth (app.getVersion()) for every version string; grep and remove hard-coded versions (also v3.0.x in the top bar). Test asserts they all match package.json.
4. **1280x720 leftovers (from your own report):** "Markers" button clipped to "M"; track-header sliders cramped. Fix with item 2; the top toolbar must wrap or collapse into an overflow menu rather than clip.
5. **Export preview file:** `export-preview.jpg` written next to the export is 580 bytes (blank). Either write a real frame or do not write it. Do not leave stray files beside the user's export.

## Not yet verified by me (you test and report, packaged app)
- Output window re-run after the rebuild (opens framed, Escape closes).
- Generate-from-Script dialog stays one size; API Keys, Commerce, Brand Kit, Keyboard sections open.
- Help → Account / Documentation open the browser with the "Opened in your browser" notice.

## Report back
Per item: what changed, the test that proves it, and the packaged-app result with screenshot paths. Do not mark anything done from dev mode. Signing/notarisation stays with Neo. Downloads stay closed.
