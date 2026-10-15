import type { ShotSpec } from '../shotSpec';
export declare const KEEPER_SHOT: ShotSpec;
export declare const EVAL_CASES: {
    readonly qa: readonly [{
        readonly id: "qa-finger";
        readonly raw: {
            readonly issues_found: readonly ["extra finger"];
            readonly defects: readonly [{
                readonly category: "hand_artifact";
                readonly evidence: "left hand has six fingers in Frame 05";
                readonly frames: readonly ["05"];
                readonly t_start: 2;
                readonly t_end: 2.5;
                readonly present: true;
                readonly confirmed: true;
                readonly severity: "major";
                readonly region: {
                    readonly x: 0.41;
                    readonly y: 0.52;
                    readonly w: 0.12;
                    readonly h: 0.15;
                };
            }];
            readonly quality_score: number;
            readonly description_match: number;
            readonly physics_accuracy: number;
            readonly character_accuracy: number;
            readonly needs_repaint: boolean;
            readonly repaint_regions: unknown[];
            readonly accept: boolean;
        };
        readonly expectRepaint: true;
    }, {
        readonly id: "qa-text";
        readonly raw: {
            readonly issues_found: readonly ["garbled sign"];
            readonly defects: readonly [{
                readonly category: "garbled_text";
                readonly evidence: "the sign letters collapse in Frame 02";
                readonly frames: readonly ["02"];
                readonly t_start: 1;
                readonly t_end: 1.2;
                readonly present: true;
                readonly confirmed: true;
                readonly severity: "major";
            }];
            readonly quality_score: number;
            readonly description_match: number;
            readonly physics_accuracy: number;
            readonly character_accuracy: number;
            readonly needs_repaint: boolean;
            readonly repaint_regions: unknown[];
            readonly accept: boolean;
        };
        readonly expectRepaint: true;
    }, {
        readonly id: "qa-identity";
        readonly raw: {
            readonly issues_found: readonly ["face changed"];
            readonly defects: readonly [{
                readonly category: "identity_drift";
                readonly evidence: "the face at Frame 08 does not match Frame 01";
                readonly frames: readonly ["08"];
                readonly t_start: 4;
                readonly t_end: 4.5;
                readonly present: true;
                readonly confirmed: true;
                readonly severity: "major";
            }];
            readonly quality_score: number;
            readonly description_match: number;
            readonly physics_accuracy: number;
            readonly character_accuracy: number;
            readonly needs_repaint: boolean;
            readonly repaint_regions: unknown[];
            readonly accept: boolean;
        };
        readonly expectRepaint: true;
    }, {
        readonly id: "qa-drift-unconfirmed";
        readonly raw: {
            readonly issues_found: readonly ["camera drift"];
            readonly defects: readonly [{
                readonly category: "camera_drift";
                readonly evidence: "the move feels faster than asked";
                readonly present: true;
                readonly confirmed: true;
                readonly severity: "minor";
            }];
            readonly quality_score: number;
            readonly description_match: number;
            readonly physics_accuracy: number;
            readonly character_accuracy: number;
            readonly needs_repaint: boolean;
            readonly repaint_regions: unknown[];
            readonly accept: boolean;
        };
        readonly expectRepaint: false;
    }];
    readonly director: readonly [{
        readonly id: "director-lighthouse";
        readonly output: {
            readonly scene_id: "S03";
            readonly intent: "The keeper sees the lamp is still lit.";
            readonly coverage_notes: "Establish, then the climb.";
            readonly shots: readonly [{
                readonly duration_s: 6;
                readonly camera: undefined;
                readonly lighting: undefined;
                readonly grade: undefined;
                readonly shot_id: string;
                readonly subject: string;
                readonly action: string;
                readonly setting: string;
                readonly audio: {
                    dialogue: {
                        speaker: string;
                        voice: string;
                        line: string;
                    }[];
                    sfx: string[];
                    ambience: string;
                    music: boolean;
                };
                readonly references: {
                    id: string;
                    role: string;
                }[];
                readonly continuity: {
                    carries_from: string | null;
                    screen_direction: string;
                    props: string[];
                };
                readonly avoid: string[];
            }];
        };
    }, {
        readonly id: "director-kitchen";
        readonly output: {
            readonly scene_id: "S04";
            readonly intent: "She leaves the key on the table.";
            readonly coverage_notes: "Master then close-up.";
            readonly shots: readonly [{
                readonly shot_id: "S04-01";
                readonly duration_s: 5;
                readonly subject: "woman at a table";
                readonly action: "leaves the key where it was placed";
                readonly setting: "kitchen, morning";
                readonly camera: undefined;
                readonly lighting: undefined;
                readonly grade: undefined;
                readonly audio: {
                    readonly dialogue: readonly [];
                    readonly sfx: readonly ["key on wood"];
                    readonly ambience: "room";
                    readonly music: false;
                };
                readonly references: readonly [];
                readonly avoid: readonly [];
                readonly continuity: {
                    carries_from: string | null;
                    screen_direction: string;
                    props: string[];
                };
            }];
        };
    }, {
        readonly id: "director-street";
        readonly output: {
            readonly scene_id: "S05";
            readonly intent: "The run and the phone call are two shots.";
            readonly coverage_notes: "Split the two actions.";
            readonly shots: readonly [{
                readonly shot_id: "S05-01";
                readonly action: "sprints across the street";
                readonly camera: undefined;
                readonly lighting: undefined;
                readonly grade: undefined;
                readonly duration_s: number;
                readonly subject: string;
                readonly setting: string;
                readonly audio: {
                    dialogue: {
                        speaker: string;
                        voice: string;
                        line: string;
                    }[];
                    sfx: string[];
                    ambience: string;
                    music: boolean;
                };
                readonly references: {
                    id: string;
                    role: string;
                }[];
                readonly continuity: {
                    carries_from: string | null;
                    screen_direction: string;
                    props: string[];
                };
                readonly avoid: string[];
            }, {
                readonly shot_id: "S05-02";
                readonly action: "answers the phone";
                readonly camera: undefined;
                readonly lighting: undefined;
                readonly grade: undefined;
                readonly duration_s: number;
                readonly subject: string;
                readonly setting: string;
                readonly audio: {
                    dialogue: {
                        speaker: string;
                        voice: string;
                        line: string;
                    }[];
                    sfx: string[];
                    ambience: string;
                    music: boolean;
                };
                readonly references: {
                    id: string;
                    role: string;
                }[];
                readonly continuity: {
                    carries_from: string | null;
                    screen_direction: string;
                    props: string[];
                };
                readonly avoid: string[];
            }];
        };
    }, {
        readonly id: "director-window";
        readonly output: {
            readonly scene_id: "S09";
            readonly intent: "The child waits.";
            readonly coverage_notes: "One idea: watching rain.";
            readonly shots: readonly [{
                readonly shot_id: "S09-01";
                readonly subject: "child";
                readonly action: "watches rain on the glass";
                readonly setting: "bedroom window";
                readonly camera: undefined;
                readonly lighting: undefined;
                readonly grade: undefined;
                readonly audio: {
                    readonly dialogue: readonly [];
                    readonly sfx: readonly ["rain"];
                    readonly ambience: "room";
                    readonly music: false;
                };
                readonly references: readonly [];
                readonly duration_s: number;
                readonly continuity: {
                    carries_from: string | null;
                    screen_direction: string;
                    props: string[];
                };
                readonly avoid: string[];
            }];
        };
    }];
    readonly compiler: readonly [{
        readonly id: "compile-veo";
        readonly model: "veo-3.1@fal";
    }, {
        readonly id: "compile-kling";
        readonly model: "kling-3.0@fal";
    }, {
        readonly id: "compile-seedance";
        readonly model: "seedance-2.0@fal";
    }, {
        readonly id: "compile-luma";
        readonly model: "luma-ray3.14@fal";
    }];
};
