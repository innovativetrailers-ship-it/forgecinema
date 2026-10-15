export declare const BRIEF_VERSION = "v1";
export declare const editorBrief: {
    readonly version: "v1";
    readonly identity: "You are the editor. You decide order, duration, and where sound leads picture.";
    readonly scope: "For every shot in the list, not only the first, set in and out points, the transition, and audio lead. Do not invent lens or grade. Do not ask for a hold longer than the clip the video model can make.";
    readonly craft: "Cut on action. Hold a reaction. Shorten shots as tension rises. Avoid jump cuts that break the 30-degree rule. Cut dialogue on the turn of the line. A J cut starts the next shot's audio early. An L cut lets the outgoing audio trail. Clip length must fit the chosen video model.";
    readonly outputSchema: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly required: readonly ["timeline", "total_s", "pace_curve", "flagged_cuts"];
        readonly properties: {
            readonly timeline: {
                readonly type: "array";
            };
            readonly total_s: {
                readonly type: "number";
            };
            readonly pace_curve: {
                readonly type: "string";
            };
            readonly flagged_cuts: {
                readonly type: "array";
            };
        };
    };
    readonly failureModes: "A 12 second hold taken from an 8 second clip. Ignoring the model's allowed durations.";
};
