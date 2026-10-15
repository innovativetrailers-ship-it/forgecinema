"use strict";
/**
 * Brain task → FAL OpenRouter model id. One table. Video delegate does not
 * read this. Open-weight bases are pinned and are not entries here.
 * Verified router family 2026-09-28: openrouter/router, /vision, /openai/v1/chat/completions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelUnavailableError = exports.DARK_CREATIVE_ALIAS = exports.OPEN_WEIGHT_MODEL_IDS = exports.OPEN_WEIGHT_ROUTE_PIN = exports.BRAIN_ROUTES = exports.MAX_QUALITY_BREAKDOWN_MODEL = exports.CREATIVE_TIER_MODEL = void 0;
exports.approvedRouteFor = approvedRouteFor;
exports.applyApprovedRoute = applyApprovedRoute;
exports.llmModelForTask = llmModelForTask;
exports.routedModelIds = routedModelIds;
exports.logExpertBrief = logExpertBrief;
exports.applyVerificationCache = applyVerificationCache;
exports.resetVerificationCache = resetVerificationCache;
exports.assertModelAvailable = assertModelAvailable;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const trainerRegistry_1 = require("../logic/trainerRegistry");
/**
 * Creative tier. Live on OpenRouter 2026-09-29: anthropic/claude-sonnet-5.
 * Blockbuster breakdown may opt into MAX_QUALITY_BREAKDOWN_MODEL.
 */
exports.CREATIVE_TIER_MODEL = 'anthropic/claude-sonnet-5';
exports.MAX_QUALITY_BREAKDOWN_MODEL = 'anthropic/claude-opus-5.5';
exports.BRAIN_ROUTES = {
    mechanical: {
        primary: 'google/gemini-3.5-flash-lite',
        fallbacks: ['openai/gpt-6-luna'],
    },
    delegation: {
        primary: 'anthropic/claude-opus-5.5',
        fallbacks: ['openai/gpt-6-astra'],
    },
    script: {
        primary: exports.CREATIVE_TIER_MODEL,
        fallbacks: ['x-ai/grok-4.7', 'openai/gpt-6-sol'],
    },
    scene: {
        primary: 'google/gemini-3.5-flash-lite',
        fallbacks: ['openai/gpt-6-luna'],
    },
    character: {
        primary: 'google/gemini-3.5-flash-lite',
        fallbacks: ['openai/gpt-6-luna'],
    },
    asset: {
        primary: 'google/gemini-3.5-flash-lite',
        fallbacks: ['openai/gpt-6-luna'],
    },
    training: {
        primary: 'anthropic/claude-opus-5.5',
        fallbacks: ['openai/gpt-6-astra'],
    },
    premise: {
        primary: 'openai/gpt-6-astra',
        fallbacks: ['anthropic/claude-opus-5.5'],
    },
};
/** Open-weight bases stay pinned. This map must not route to or replace them. */
exports.OPEN_WEIGHT_ROUTE_PIN = {
    class: 'open-weight-base',
    pinned: true,
};
/** Debate approvals may not swap these. Wave 4 owns the open-weight lane. */
const wan22 = trainerRegistry_1.OPEN_WEIGHT_BASES['wan-2.2'];
exports.OPEN_WEIGHT_MODEL_IDS = [
    'wan-2.2',
    wan22.t2vA14b,
    wan22.ti2v5b,
    wan22.trainer,
];
const approvedRoutes = new Map();
function approvedRouteFor(task) {
    return approvedRoutes.get(task);
}
/** Human approval only. Refuses an open-weight id. */
function applyApprovedRoute(task, model) {
    const next = model.trim();
    if (!next)
        throw new Error('Approved route is empty');
    if (exports.OPEN_WEIGHT_MODEL_IDS.includes(next)) {
        throw new Error(`Open-weight model ${next} cannot be a routing swap`);
    }
    if (!exports.BRAIN_ROUTES[task])
        throw new Error(`Unknown brain task ${task}`);
    approvedRoutes.set(task, next);
    console.log('[routing_approved]', JSON.stringify({ task, model: next }));
}
const CHEAP_TIER = 'google/gemini-3.5-flash-lite';
const DARK_CREATIVE = 'x-ai/grok-4.7';
/** Dated alias on the OpenRouter list. Presence of the id is T1. The adapter row stays T2. */
exports.DARK_CREATIVE_ALIAS = 'x-ai/grok-4.7-20260916';
const POLISHED_CREATIVE = exports.CREATIVE_TIER_MODEL;
function llmModelForTask(task, opts) {
    const route = exports.BRAIN_ROUTES[task];
    const approved = approvedRoutes.get(task);
    if (approved && !opts?.budget && !opts?.tone) {
        return { model: approved, task, substituted: approved !== route.primary, reason: 'approved-debate' };
    }
    if (opts?.budget === 'tight') {
        const choice = {
            model: CHEAP_TIER,
            task,
            substituted: CHEAP_TIER !== route.primary,
            reason: 'budget-tight',
        };
        if (choice.substituted) {
            console.log('[brain_route_substituted]', JSON.stringify(choice));
        }
        assertModelAvailable(task, choice.model);
        return choice;
    }
    if (opts?.tone === 'dark' && (task === 'script' || task === 'character')) {
        const choice = {
            model: DARK_CREATIVE,
            task,
            substituted: true,
            reason: 'tone-dark',
        };
        console.log('[brain_route_substituted]', JSON.stringify(choice));
        assertModelAvailable(task, choice.model);
        return choice;
    }
    if (opts?.tone === 'polished' && task === 'script' && !route.primary.startsWith('anthropic/')) {
        const choice = {
            model: POLISHED_CREATIVE,
            task,
            substituted: true,
            reason: 'tone-polished',
        };
        console.log('[brain_route_substituted]', JSON.stringify(choice));
        assertModelAvailable(task, choice.model);
        return choice;
    }
    assertModelAvailable(task, route.primary);
    return { model: route.primary, task, substituted: false, reason: 'primary' };
}
/** Every id this table can send. Verification reads this. It does not change the table. */
function routedModelIds() {
    const ids = new Set();
    for (const route of Object.values(exports.BRAIN_ROUTES)) {
        ids.add(route.primary);
        for (const fallback of route.fallbacks)
            ids.add(fallback);
    }
    return [...ids];
}
/** Logged on every expert-brief call. The version is the brief's BRIEF_VERSION. */
function logExpertBrief(role, version) {
    console.log('[expert_brief]', JSON.stringify({ role, version }));
}
const STYLE_UNAVAILABLE = 'This style is temporarily unavailable';
class ModelUnavailableError extends Error {
    role;
    modelId;
    reason;
    constructor(role, modelId, reason) {
        super(STYLE_UNAVAILABLE);
        this.name = 'ModelUnavailableError';
        this.role = role;
        this.modelId = modelId;
        this.reason = reason;
    }
}
exports.ModelUnavailableError = ModelUnavailableError;
let cacheOverride = null;
let cacheLoaded = null;
/** Test and startup hook. Replaces the on-disk verification cache. */
function applyVerificationCache(missing) {
    cacheOverride = new Set(missing);
}
function resetVerificationCache() {
    cacheOverride = null;
    cacheLoaded = null;
}
function missingFromCache() {
    if (cacheOverride)
        return cacheOverride;
    if (cacheLoaded)
        return cacheLoaded;
    cacheLoaded = new Set();
    try {
        const raw = (0, node_fs_1.readFileSync)((0, node_path_1.resolve)(process.cwd(), 'docs/model-route-cache.json'), 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.missing)) {
            cacheLoaded = new Set(parsed.missing.filter((id) => typeof id === 'string'));
        }
    }
    catch (err) {
        console.warn('[model_unavailable]', err instanceof Error ? err.message : err);
    }
    return cacheLoaded;
}
/** Throws when the verification cache marks this id missing. Does not pick another model. */
function assertModelAvailable(role, modelId) {
    if (!missingFromCache().has(modelId))
        return;
    const reason = 'missing from the verification cache';
    console.error('[model_unavailable]', JSON.stringify({ role, modelId, reason }));
    throw new ModelUnavailableError(role, modelId, reason);
}
//# sourceMappingURL=routing.js.map