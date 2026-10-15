"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GROK_REASONING_ALLOWANCE = exports.CONTRACT_INSTRUCTION = void 0;
exports.roleExample = roleExample;
exports.requiredTopLevelKeys = requiredTopLevelKeys;
exports.renderRoleContract = renderRoleContract;
exports.expertRepairMessage = expertRepairMessage;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const validate_1 = require("./validate");
exports.CONTRACT_INSTRUCTION = 'Return only JSON with exactly these keys; no extra keys.';
/**
 * The 2026-10-16 smoke sent max_tokens 400 and was billed 1158 completion
 * tokens at Grok's default effort (high), finish reason stop. Reasoning is
 * mandatory on that model and was not inside the cap. OpenRouter's effort
 * table assigns low about 20% of the budget and high about 80%. That guess was
 * 190. The low-effort re-smoke still billed 977 completion tokens, 577 above
 * the 400 cap. The allowance is that observed overrun.
 */
exports.GROK_REASONING_ALLOWANCE = 577;
function examplesDir() {
    const here = (0, node_path_1.dirname)(__filename);
    const candidates = [
        (0, node_path_1.resolve)(here, 'examples'),
        (0, node_path_1.resolve)(here, '../../src/experts/examples'),
    ];
    return candidates.find((dir) => (0, node_fs_1.existsSync)((0, node_path_1.resolve)(dir, 'director.json'))) ?? candidates[0];
}
function roleExample(role) {
    const raw = (0, node_fs_1.readFileSync)((0, node_path_1.resolve)(examplesDir(), `${role}.json`), 'utf8');
    const rows = JSON.parse(raw);
    return rows[0]?.output;
}
function requiredTopLevelKeys(role) {
    const schema = validate_1.ROLE_BRIEFS[role].outputSchema;
    return schema.required ?? [];
}
function rangeOf(schema) {
    const bits = [];
    if (schema.minimum !== undefined)
        bits.push(`minimum ${schema.minimum}`);
    if (schema.maximum !== undefined)
        bits.push(`maximum ${schema.maximum}`);
    if (schema.minLength !== undefined)
        bits.push(`minLength ${schema.minLength}`);
    if (schema.maxLength !== undefined)
        bits.push(`maxLength ${schema.maxLength}`);
    if (schema.minItems !== undefined)
        bits.push(`minItems ${schema.minItems}`);
    if (schema.maxItems !== undefined)
        bits.push(`maxItems ${schema.maxItems}`);
    if (schema.enum)
        bits.push(`enum ${schema.enum.map((item) => JSON.stringify(item)).join(', ')}`);
    return bits.length ? ` (${bits.join(', ')})` : '';
}
function describeFields(schema, indent) {
    const pad = '  '.repeat(indent);
    const required = new Set(schema.required ?? []);
    const lines = [];
    for (const [name, child] of Object.entries(schema.properties ?? {})) {
        const need = required.has(name) ? 'required' : 'optional';
        lines.push(`${pad}- ${name}: ${child.type ?? 'value'}, ${need}${rangeOf(child)}`);
        if (child.properties)
            lines.push(...describeFields(child, indent + 1));
        if (child.items?.properties)
            lines.push(...describeFields(child.items, indent + 1));
    }
    return lines;
}
function renderRoleContract(role) {
    const schema = validate_1.ROLE_BRIEFS[role].outputSchema;
    return [
        exports.CONTRACT_INSTRUCTION,
        'JSON schema:',
        JSON.stringify(schema, null, 2),
        'Fields:',
        ...describeFields(schema, 0),
        'Example:',
        JSON.stringify(roleExample(role), null, 2),
    ].join('\n');
}
function expertRepairMessage(issues) {
    return `These fields are missing or wrong: ${issues.join('; ')}; return corrected JSON only`;
}
//# sourceMappingURL=contract.js.map