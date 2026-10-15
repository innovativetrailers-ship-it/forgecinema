/** Every structured OpenRouter call asks the provider to honour the schema. */

export function openRouterEnvelope(schema: unknown, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...extra,
    require_parameters: true,
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'expert_output', strict: false, schema },
    },
  }
}
