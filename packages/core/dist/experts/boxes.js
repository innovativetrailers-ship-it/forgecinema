"use strict";
/** Forge boxes are normalised 0–1, origin top-left, x,y,w,h. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoxConversionError = void 0;
exports.assertBoxArea = assertBoxArea;
exports.claudePixelsToForge = claudePixelsToForge;
exports.geminiBoxToForge = geminiBoxToForge;
exports.gptBoxToForge = gptBoxToForge;
class BoxConversionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BoxConversionError';
    }
}
exports.BoxConversionError = BoxConversionError;
function clamp01(n) {
    if (!Number.isFinite(n))
        return 0;
    return Math.min(1, Math.max(0, n));
}
function assertBoxArea(box) {
    if (box.w <= 0 || box.h <= 0) {
        throw new BoxConversionError('Box has zero area');
    }
}
/** Claude: absolute [x1, y1, x2, y2] pixels of the image as sent. */
function claudePixelsToForge(box, width, height) {
    if (width <= 0 || height <= 0)
        throw new BoxConversionError('Image size is zero');
    const [x1, y1, x2, y2] = box;
    const next = {
        x: clamp01(Math.min(x1, x2) / width),
        y: clamp01(Math.min(y1, y2) / height),
        w: clamp01(Math.abs(x2 - x1) / width),
        h: clamp01(Math.abs(y2 - y1) / height),
    };
    assertBoxArea(next);
    return next;
}
/**
 * Gemini box_2d is [ymin, xmin, ymax, xmax] on a 0–1000 scale, y first.
 * Swapping y and x changes the returned x.
 */
function geminiBoxToForge(box) {
    const [ymin, xmin, ymax, xmax] = box;
    const next = {
        x: clamp01(Math.min(xmin, xmax) / 1000),
        y: clamp01(Math.min(ymin, ymax) / 1000),
        w: clamp01(Math.abs(xmax - xmin) / 1000),
        h: clamp01(Math.abs(ymax - ymin) / 1000),
    };
    assertBoxArea(next);
    return next;
}
/** GPT-6 has no verified box convention. Callers must not ask it to localise. */
function gptBoxToForge() {
    throw new BoxConversionError('GPT-6 is text fallback only and does not localise boxes');
}
//# sourceMappingURL=boxes.js.map