/**
 * Cheap Crew Analyst System
 *
 * The Intelligence Domain uses the cheapest capable models to write
 * analysis reports. These cost 10-50× less than the Council and are
 * perfectly capable of structured reporting tasks.
 *
 * For text analysis and report writing: Claude Haiku
 * For probe execution: existing model clients via swarm
 */

export type CrewRole =
  | 'probe_runner'      // Executes standardised test prompts against all models
  | 'output_analyst'    // Compares and describes model output differences
  | 'report_writer'     // Synthesises findings into structured reports
  | 'anomaly_detector'  // Flags when a model behaves differently than expected
  | 'update_watcher'    // Monitors model version changes and new releases

// Crew assignments — cheap models for cheap tasks
// Model IDs map to the swarm's ModelId enum (what executes the probe)
// Text analysis uses Claude Haiku via callDomainLLM('intelligence')
export const CREW_ASSIGNMENTS: Record<CrewRole, { model: string; costIndex: number; description: string }> = {
  probe_runner:     { model: 'wan_2_6',           costIndex: 1,   description: 'Runs standard probes against target models' },
  output_analyst:   { model: 'ltx_2_3',           costIndex: 1.5, description: 'Analyses visual outputs and compares results' },
  report_writer:    { model: 'claude-haiku-4-5',  costIndex: 1,   description: 'Writes structured intelligence reports (text-only)' },
  anomaly_detector: { model: 'ltx_2_3',           costIndex: 1.5, description: 'Spots unusual or changed model behaviour' },
  update_watcher:   { model: 'mochi_1',           costIndex: 1,   description: 'Monitors model version changes and changelogs' },
}

// System prompts used by cheap crew — not the Council, not Model 1
export const CREW_SYSTEM_PROMPTS: Record<CrewRole, string> = {
  probe_runner: `You are a machine learning probe operator. Your job is to generate test videos using specific models and record the results. Be precise, methodical, and objective. Return structured JSON only.`,

  output_analyst: `You are a video quality analyst. You compare model outputs against probe targets. 
Assess: physics accuracy, temporal consistency, prompt adherence, motion quality, visual artifacts.
Score 0-10 per dimension. Be specific about what succeeded and what failed.
Return structured JSON only.`,

  report_writer: `You are a machine learning research analyst writing internal competitive intelligence reports.
Write precise, factual, technical reports based on benchmark probe results.
Focus on: failure patterns, prompt sensitivity, capability boundaries.
Be specific. No marketing language. No hedging. State what was observed.
Return structured JSON only.`,

  anomaly_detector: `You are an anomaly detection system for AI video model behaviour.
Compare current probe results against historical baselines.
Flag: quality regressions, new failure modes, unexpected improvements, version fingerprints.
Score deviation significance 0-1. State exact differences observed.
Return structured JSON only.`,

  update_watcher: `You are a model version monitoring system.
Your job is to detect when AI video generation models have been silently updated.
Compare probe outputs to identify quality shifts, new capabilities, or removed features.
Report: which capabilities changed, by how much, and in which direction.
Return structured JSON only.`,
}

// Assessment system prompt for vision-capable analysis
export const OUTPUT_ASSESSMENT_PROMPT = `You are a video quality assessor analysing a single AI-generated video.
You are given:
- The probe prompt (what was requested)
- The target criteria (what specific capability is being tested)
- Frame descriptions or frame images from the video

Assess the video against the target criteria. Score 0-10 (10 = perfect adherence).
Return JSON:
{
  "quality_score": <0-10>,
  "issues": ["list of specific failure points"],
  "strengths": ["list of specific successes"],
  "notes": "detailed technical assessment",
  "prompt_adherence": <0-10>,
  "physics_accuracy": <0-10>,
  "motion_quality": <0-10>
}`

// The full report generation prompt template
export function buildReportPrompt(modelId: string, groupedResults: Record<string, unknown>): string {
  return `Write a competitive intelligence report for model: ${modelId}

Probe results by category:
${JSON.stringify(groupedResults, null, 2)}

Return JSON matching this schema exactly:
{
  "model_id": "${modelId}",
  "model_version": "string",
  "report_date": "ISO date string",
  "generated_by": "claude-haiku",
  "strengths": ["array of strength strings"],
  "weaknesses": ["array of weakness strings"],
  "failure_modes": [{"trigger":"","manifestation":"","frequency":0.0,"severity":1}],
  "prompt_sensitivity": {
    "synonyms_matter": true,
    "order_matters": true,
    "detail_level_optimal": "medium",
    "forbidden_words": [],
    "power_words": []
  },
  "consistency_score": 0.0,
  "physics_accuracy": {
    "rigid_body_score": 0,
    "fluid_dynamics_score": 0,
    "cloth_simulation_score": 0,
    "notes": ""
  },
  "motion_quality": {
    "human_biomechanics_score": 0,
    "camera_control_score": 0,
    "animal_motion_score": 0,
    "temporal_consistency_score": 0,
    "notes": ""
  },
  "text_rendering": {
    "legibility_score": 0,
    "accuracy_score": 0,
    "style_preservation_score": 0,
    "notes": ""
  },
  "character_fidelity": {
    "appearance_consistency_score": 0,
    "face_quality_score": 0,
    "expression_accuracy_score": 0,
    "notes": ""
  },
  "generation_speed_profile": {
    "avg_generation_seconds": 0,
    "draft_seconds": 0,
    "studio_seconds": 0,
    "blockbuster_seconds": 0
  },
  "quality_vs_duration": {
    "seconds_4_score": 0,
    "seconds_8_score": 0,
    "seconds_16_score": 0,
    "notes": ""
  },
  "resolution_stability": {
    "supports_720p": true,
    "supports_1080p": true,
    "supports_4k": false,
    "optimal_resolution": "1080p",
    "stability_notes": ""
  },
  "optimal_scene_types": [],
  "avoid_scene_types": [],
  "cost_efficiency_rating": 0.0,
  "training_examples": [],
  "distillation_candidates": []
}`
}

export function buildDeltaReportPrompt(
  modelId: string,
  previousVersion: string,
  newVersion: string,
  baseline: Record<string, unknown>,
  currentResults: Record<string, unknown>
): string {
  return `Write a delta intelligence report comparing two versions of model: ${modelId}

Previous version: ${previousVersion}
New version: ${newVersion}

Baseline probe results (old version):
${JSON.stringify(baseline, null, 2)}

Current probe results (new version):
${JSON.stringify(currentResults, null, 2)}

Return JSON:
{
  "improved_categories": ["categories that improved"],
  "degraded_categories": ["categories that got worse"],
  "significance_score": 0.0,
  "summary": "one paragraph technical summary of what changed and why it matters for routing"
}`
}
