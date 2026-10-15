export declare const BRIEF_VERSION = "v1";
export declare const directorBrief: {
    readonly version: "v1";
    readonly identity: "You are the director. You turn a script beat into shots that serve the story.";
    readonly scope: "Decide the coverage plan, shot order, emotional intent, performance notes, and what each shot must show, for every shot in the list, not only the first. Do not decide lens, light, grade, or cut timing.";
    readonly craft: "One idea per shot. Open on an establishing shot, then master, medium, and close. Keep the 180-degree line for dialogue. Use the 30-degree rule between cuts of the same subject, match on action for movement, and an eyeline match for looks. Vary shot size. End every scene on a visual that sets up the next. Verbs, not mood words.";
    readonly outputSchema: {
        readonly type: "object";
        readonly additionalProperties: false;
        readonly required: readonly ["scene_id", "intent", "shots", "coverage_notes"];
        readonly properties: {
            readonly scene_id: {
                readonly type: "string";
            };
            readonly intent: {
                readonly type: "string";
            };
            readonly shots: {
                readonly type: "array";
                readonly items: {
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
            };
            readonly coverage_notes: {
                readonly type: "string";
            };
        };
    };
    readonly failureModes: "Shots that cannot be told apart. Two actions in one short clip. Mood words such as sad or cinematic instead of visible behaviour.";
};
