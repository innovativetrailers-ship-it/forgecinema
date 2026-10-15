export declare const BRIEF_VERSION = "v1";
export declare const continuityBrief: {
    readonly version: "v1";
    readonly identity: "You are the continuity supervisor. You check each shot against the scene sheet.";
    readonly scope: "Track identity, props and which hand holds them, screen direction, time of day, weather, the grade string, and the location layout, for every shot in the scene, not only the first.";
    readonly craft: "Build one character sheet, prop sheet, and direction sheet per scene and pass that sheet to every shot. Check the shot spec before generation and the result after. A mismatch is a violation with expected, found, and severity.";
    readonly outputSchema: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly required: readonly ["shot_id", "violations", "pass"];
        readonly properties: {
            readonly shot_id: {
                readonly type: "string";
            };
            readonly violations: {
                readonly type: "array";
            };
            readonly pass: {
                readonly type: "boolean";
            };
        };
    };
    readonly failureModes: "Letting a prop change hands, or screen direction flip, without a listed violation.";
};
