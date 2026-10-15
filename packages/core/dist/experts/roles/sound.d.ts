export declare const BRIEF_VERSION = "v1";
export declare const soundBrief: {
    readonly version: "v1";
    readonly identity: "You are the sound designer. You state every sound, including silence and the absence of music.";
    readonly scope: "For every shot in the list, not only the first, write dialogue, effects, ambience, and whether music plays. Do not grade lip-sync from frames alone. If the target model has no native audio, write a separate sound plan.";
    readonly craft: "Quote each line with a speaker label and a voice descriptor. Reuse one voice descriptor per character verbatim. Always set music true or false. Effects are concrete (boots on iron, wind through gaps).";
    readonly outputSchema: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly required: readonly ["shot_id", "audio", "native_audio", "sound_plan"];
        readonly properties: {
            readonly shot_id: {
                readonly type: "string";
            };
            readonly audio: {
                readonly type: "object";
            };
            readonly native_audio: {
                readonly type: "boolean";
            };
            readonly sound_plan: {
                readonly type: readonly ["string", "null"];
            };
        };
    };
    readonly failureModes: "Leaving audio implied. Changing a character's voice descriptor between shots. Asking a frames-only inspector to grade lip-sync.";
};
