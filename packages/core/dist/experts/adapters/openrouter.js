"use strict";
/** Every structured OpenRouter call asks the provider to honour the schema. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.openRouterEnvelope = openRouterEnvelope;
function openRouterEnvelope(schema, extra = {}) {
    return {
        ...extra,
        require_parameters: true,
        response_format: {
            type: 'json_schema',
            json_schema: { name: 'expert_output', strict: false, schema },
        },
    };
}
//# sourceMappingURL=openrouter.js.map