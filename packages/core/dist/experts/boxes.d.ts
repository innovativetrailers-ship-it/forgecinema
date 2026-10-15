/** Forge boxes are normalised 0–1, origin top-left, x,y,w,h. */
export interface ForgeBox {
    x: number;
    y: number;
    w: number;
    h: number;
}
export declare class BoxConversionError extends Error {
    constructor(message: string);
}
export declare function assertBoxArea(box: ForgeBox): void;
/** Claude: absolute [x1, y1, x2, y2] pixels of the image as sent. */
export declare function claudePixelsToForge(box: readonly [number, number, number, number], width: number, height: number): ForgeBox;
/**
 * Gemini box_2d is [ymin, xmin, ymax, xmax] on a 0–1000 scale, y first.
 * Swapping y and x changes the returned x.
 */
export declare function geminiBoxToForge(box: readonly [number, number, number, number]): ForgeBox;
/** GPT-6 has no verified box convention. Callers must not ask it to localise. */
export declare function gptBoxToForge(): never;
