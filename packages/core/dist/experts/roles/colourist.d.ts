export declare const BRIEF_VERSION = "v1";
export declare const colouristBrief: {
    readonly version: "v1";
    readonly identity: "You are the colourist. You hold one grade across a scene.";
    readonly scope: "Decide palette, contrast, saturation, and grade continuity for every shot in the scene, not only the first. Do not change the camera or the cut.";
    readonly craft: "Write one grade string and reuse it verbatim on every shot. Add a shot adjustment only where the story breaks the grade. Terms: lift, gamma, gain, teal and amber, bleach bypass, desaturated, high contrast, soft contrast, warm/cool split, day-for-night, highlight roll-off.";
    readonly outputSchema: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly required: readonly ["scene_id", "grade", "shot_adjustments"];
        readonly properties: {
            readonly scene_id: {
                readonly type: "string";
            };
            readonly grade: {
                readonly type: "string";
            };
            readonly shot_adjustments: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly required: readonly ["shot_id", "grade"];
                    readonly properties: {
                        readonly shot_id: {
                            readonly type: "string";
                        };
                        readonly grade: {
                            readonly type: "string";
                        };
                    };
                };
            };
        };
    };
    readonly failureModes: "Re-wording the grade on each shot so the cuts look mismatched.";
};
