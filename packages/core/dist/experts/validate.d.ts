import { type QaOutput } from './qaSchema';
export declare const EXPERT_ROLES: readonly ["director", "cinematographer", "colourist", "editor", "sound", "continuity", "qa"];
export type ExpertRole = (typeof EXPERT_ROLES)[number];
export declare const ROLE_BRIEFS: {
    readonly director: {
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
    readonly cinematographer: {
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
    readonly colourist: {
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
    readonly editor: {
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
    readonly sound: {
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
    readonly continuity: {
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
    readonly qa: {
        readonly version: "v1";
        readonly identity: "You are the quality inspector. You judge one defect category at a time and you stay sceptical.";
        readonly scope: "For every supplied frame, not only the first, answer one category: identity drift, morphing, physics, hand or face, flicker, garbled text, camera drift, prompt mismatch, and audio mismatch only when audio is supplied. Do not invent a defect you cannot point at.";
        readonly craft: "Write evidence with a frame id or a timestamp before present and severity. A defect with no frame or timestamp is unconfirmed and must not request a repaint. Scores are bands from 1 to 5: 1-2 reject, 3 marginal, 4-5 accept. Ask for evidence, never a field named reasoning. Frames are labelled Frame 07, t=00:03.50. Boxes inside Forge are x, y, w, h from 0 to 1, origin top-left.";
        readonly outputSchema: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: readonly ["quality_score", "description_match", "physics_accuracy", "character_accuracy", "defects", "issues_found", "needs_repaint", "repaint_regions", "accept"];
            readonly properties: {
                readonly quality_score: {
                    readonly type: "number";
                };
                readonly description_match: {
                    readonly type: "number";
                };
                readonly physics_accuracy: {
                    readonly type: "number";
                };
                readonly character_accuracy: {
                    readonly type: "number";
                };
                readonly defects: {
                    readonly type: "array";
                };
                readonly issues_found: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly needs_repaint: {
                    readonly type: "boolean";
                };
                readonly repaint_regions: {
                    readonly type: "array";
                };
                readonly accept: {
                    readonly type: "boolean";
                };
            };
        };
        readonly failureModes: "A single vague score for the whole video. A repaint with no cited frame. Counting or anatomy claims with no evidence.";
    };
};
export declare class ExpertOutputError extends Error {
    readonly role: ExpertRole;
    readonly version: string;
    readonly issues: string[];
    constructor(role: ExpertRole, version: string, issues: string[]);
}
export declare function validateRoleOutput(role: ExpertRole, raw: unknown, clipDurationS?: number): {
    ok: true;
    value: unknown;
} | {
    ok: false;
    issues: string[];
};
/**
 * One repair on the same route. The repair function is injected so tests
 * spend nothing. A second failure throws. Fields are never invented here.
 */
export declare function acceptRoleOutput(role: ExpertRole, raw: unknown, repair: (issues: string[]) => Promise<unknown>, clipDurationS?: number): Promise<unknown>;
export declare function composeRolePrompt(role: ExpertRole): string;
export type { QaOutput };
