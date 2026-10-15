# Run 48 — Desktop 3.0.8: Source/Program monitors overlap (do not stop until fixed and re-tested in the PACKAGED app)

Source: your own screenshots `docs/screens/editor-1456x819.png` and `editor-1280x720.png` (3.0.8). Playback, track headers, version strings and 1280 toolbar are accepted. Do not touch them.

## Defect (visible in your own screenshots)
Once the Source monitor holds a clip, the Source and Program panels overlap:
- The Source picture (red) runs under/into the Program panel; the boundary is at about x=978 (1456 shot) and x=976 (1280 shot) instead of a clean split with a gutter.
- The Source overlay bar (`00:00:00:00`, "Write", scope/monitor/channel chips "Scope: Off | Monitor: Off | Ch: RGB") sits on top of the Source timecode.
- The Source transport/tool row (Action, Title, Thirds, Center) is cut off by the Program panel ("T" visible at 1280).
- Program picture is offset (does not fill or letterbox inside its own panel).

## Fix
1. Source and Program are two panels with a fixed gutter, each `overflow: hidden`, each `min-width: 0`, split 50/50 by default, with a draggable divider. No panel may paint outside its own box.
2. Each monitor's video area letterboxes inside its own box (object-fit: contain). Overlays (timecode, chips) are positioned inside the box and wrap or collapse to an overflow "…" menu when narrow; they never overlap each other.
3. Source transport/tool row wraps onto a second line or collapses to an overflow menu at narrow widths; no clipped labels at 1280x720.
4. Same fix for the Output window and any other place these monitor components are reused.

## Proof required (packaged app via `open -n`, not dev mode)
- Screenshots with a clip loaded in BOTH monitors and the playhead mid-clip, at 1456x819 and 1280x720 and one at 1100x700, saved to `docs/screens/monitors-<size>.png`.
- A layout test that loads a clip into Source, plays, and asserts via bounding boxes that Source.right <= Program.left and no overlay rect intersects another overlay rect, at the three sizes.
- Report each size: pass/fail with the measured rects.

If code changes, bump to 3.0.9, rerun the Mach-O gate (inspected > 0), regenerate release markers. Signing/notarisation stays with Neo. Downloads stay closed.
