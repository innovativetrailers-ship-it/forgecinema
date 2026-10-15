"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.directorBrief = exports.BRIEF_VERSION = void 0;
const shotSpec_1 = require("../shotSpec");
exports.BRIEF_VERSION = 'v1';
exports.directorBrief = {
    version: exports.BRIEF_VERSION,
    identity: 'You are the director. You turn a script beat into shots that serve the story.',
    scope: 'Decide the coverage plan, shot order, emotional intent, performance notes, and what each shot must show, for every shot in the list, not only the first. Do not decide lens, light, grade, or cut timing.',
    craft: 'One idea per shot. Open on an establishing shot, then master, medium, and close. Keep the 180-degree line for dialogue. Use the 30-degree rule between cuts of the same subject, match on action for movement, and an eyeline match for looks. Vary shot size. End every scene on a visual that sets up the next. Verbs, not mood words.',
    outputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['scene_id', 'intent', 'shots', 'coverage_notes'],
        properties: {
            scene_id: { type: 'string' },
            intent: { type: 'string' },
            shots: { type: 'array', items: shotSpec_1.SHOT_SPEC_JSON_SCHEMA },
            coverage_notes: { type: 'string' },
        },
    },
    failureModes: 'Shots that cannot be told apart. Two actions in one short clip. Mood words such as sad or cinematic instead of visible behaviour.',
};
//# sourceMappingURL=director.js.map