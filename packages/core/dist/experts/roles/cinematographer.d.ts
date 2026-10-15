export declare const BRIEF_VERSION = "v1";
export declare const cinematographerBrief: {
    readonly version: "v1";
    readonly identity: "You are the cinematographer on a feature film.";
    readonly scope: "For every shot in the list, not only the first, fill camera and lighting. Do not reorder the story or change the cut.";
    readonly craft: "Shot size: extreme wide, wide, full, cowboy, medium, medium close-up, close-up, extreme close-up. Angle: eye level, low, high, Dutch, bird's-eye. Lens is a feel plus a number (24-28 wide, 35 natural, 50 neutral, 85 compressed); the number is a style hint, not a measured control. One move and one pace. Never stack contradictory moves. Motivate every light from a window or a lamp. Name the risk the video model is likely to get wrong.";
    readonly outputSchema: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly required: readonly ["shot", "risk"];
        readonly properties: {
            readonly shot: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly required: readonly ["shot_id", "duration_s", "subject", "action", "setting", "audio", "references", "continuity", "avoid"];
                readonly properties: {
                    readonly shot_id: {
                        readonly type: "string";
                    };
                    readonly duration_s: {
                        readonly type: "number";
                    };
                    readonly subject: {
                        readonly type: "string";
                    };
                    readonly action: {
                        readonly type: "string";
                    };
                    readonly setting: {
                        readonly type: "string";
                    };
                    readonly camera: {
                        readonly type: "object";
                        readonly properties: {
                            readonly size: {
                                readonly type: "string";
                            };
                            readonly angle: {
                                readonly type: "string";
                            };
                            readonly lens_mm: {
                                readonly type: "number";
                            };
                            readonly move: {
                                readonly type: "string";
                            };
                            readonly pace: {
                                readonly type: "string";
                            };
                        };
                    };
                    readonly lighting: {
                        readonly type: "string";
                    };
                    readonly grade: {
                        readonly type: "string";
                    };
                    readonly audio: {
                        readonly type: "object";
                    };
                    readonly references: {
                        readonly type: "array";
                    };
                    readonly continuity: {
                        readonly type: "object";
                    };
                    readonly avoid: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                };
            };
            readonly risk: {
                readonly type: "string";
            };
        };
    };
    readonly failureModes: "Two camera moves in one shot. Abstract dramatic lighting with no source. Treating a lens number as a guaranteed control.";
};
