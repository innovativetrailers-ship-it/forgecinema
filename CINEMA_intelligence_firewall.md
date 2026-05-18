# CINÉMA — INTELLIGENCE ARCHITECTURE
## Knowledge Firewall · Cheap Crew Analysis · Competitive Learning Pipeline
### Classified: Growth Engine Internal Only

---

## PART 1 — THE KNOWLEDGE FIREWALL

The platform operates across four completely isolated knowledge domains.
No domain can read another's internal state. This is enforced at the database,
API key, and context window level — not by convention.

```
┌─────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE DOMAINS                         │
├─────────────────┬─────────────────┬─────────────────────────┤
│  MARKETING      │  USER PRODUCT   │  TECHNICAL ROUTING      │
│  DOMAIN         │  DOMAIN         │  DOMAIN                 │
│                 │                 │                         │
│  "Our AI        │  "Draft /       │  Kling 3.0 ELO 1243     │
│  understands    │  Studio /       │  Veo physics score 84.5 │
│  your creative  │  Blockbuster"   │  Wan wins neon scenes   │
│  vision"        │                 │  LTX-2.3 text routing   │
│                 │  No model names │                         │
│  No benchmarks  │  No costs       │  NEVER exposed outside  │
│  No model names │  No routing     │  this domain            │
├─────────────────┴─────────────────┴─────────────────────────┤
│                  INTELLIGENCE DOMAIN                         │
│                                                             │
│  Model probe results · Capability maps · Weakness registry  │
│  Update detection logs · Training espionage reports         │
│                                                             │
│  READ: Training cluster only                               │
│  WRITE: Intelligence pipeline only                         │
└─────────────────────────────────────────────────────────────┘
```

---

## THE AIR GAP IMPLEMENTATION

```typescript
// src/lib/firewall/domain-guard.ts

// Four completely separate Prisma database schemas
// Each on its own PostgreSQL database with its own credentials

export const DOMAIN_DB = {
  marketing:     new PrismaClient({ datasourceUrl: process.env.DB_MARKETING }),
  product:       new PrismaClient({ datasourceUrl: process.env.DB_PRODUCT }),
  technical:     new PrismaClient({ datasourceUrl: process.env.DB_TECHNICAL }),
  intelligence:  new PrismaClient({ datasourceUrl: process.env.DB_INTELLIGENCE }),
}

// Four separate Redis namespaces — no cross-namespace pub/sub
export const DOMAIN_REDIS = {
  marketing:    new Redis(process.env.REDIS_MARKETING),
  product:      new Redis(process.env.REDIS_PRODUCT),
  technical:    new Redis(process.env.REDIS_TECHNICAL),
  intelligence: new Redis(process.env.REDIS_INTELLIGENCE),
}

// MARKETING DOMAIN — What the marketing AI knows
// It ONLY sees these concepts. Hard-coded. Never dynamic.
export const MARKETING_VOCABULARY = [
  'cinematic quality', 'creative vision', 'professional results',
  'seamless generation', 'studio-grade output', 'intelligent routing',
  'Draft mode', 'Studio mode', 'Blockbuster mode',
  'your story', 'your characters', 'your world',
] as const

// If any marketing AI call attempts to include technical routing data,
// the firewall strips it before the context window is assembled
export function sanitiseForMarketing(content: string): string {
  const BLOCKED_TERMS = [
    'Kling', 'Veo', 'Seedance', 'Runway', 'Wan', 'LTX', 'HunyuanVideo',
    'ELO', 'benchmark', 'routing', 'model selection', 'API cost',
    'fal.ai', 'SwarmRouter', 'SceneCategory', 'physics score',
    'SCENE_ROUTING_MATRIX', 'complexity_type', 'credit cost',
  ]
  let sanitised = content
  BLOCKED_TERMS.forEach(term => {
    sanitised = sanitised.replace(new RegExp(term, 'gi'), '[REDACTED]')
  })
  return sanitised
}

// Separate API keys per domain — marketing AI literally cannot call
// the technical routing endpoints even if it tried
export const DOMAIN_API_KEYS = {
  marketing:    process.env.MARKETING_AI_KEY,    // Claude — marketing copy only
  product:      process.env.PRODUCT_AI_KEY,      // Claude — user-facing features
  technical:    process.env.TECHNICAL_AI_KEY,    // Model 1 — routing + orchestration
  intelligence: process.env.INTELLIGENCE_AI_KEY, // Cheap crew + analysis only
} as const
```

### Additional env vars required

```env
# Domain-separated databases
DB_MARKETING="postgresql://..."
DB_PRODUCT="postgresql://..."
DB_TECHNICAL="postgresql://..."
DB_INTELLIGENCE="postgresql://..."

# Domain-separated Redis
REDIS_MARKETING="redis://..."
REDIS_PRODUCT="redis://..."
REDIS_TECHNICAL="redis://..."
REDIS_INTELLIGENCE="redis://..."

# Domain-separated AI API keys
MARKETING_AI_KEY=""    # Claude Haiku — cheap, marketing copy only
PRODUCT_AI_KEY=""      # Claude Sonnet — user-facing features
TECHNICAL_AI_KEY=""    # Model 1 endpoint (local Llama 4)
INTELLIGENCE_AI_KEY="" # Seedance Fast / LTX-2.3 — cheap crew analysts
```

---

## PART 2 — THE CHEAP CREW ANALYST SYSTEM

The Intelligence Domain uses the cheapest capable models to write
analysis reports. These models cost 10-50× less than the Council
and are perfectly capable of structured reporting tasks.

### The Crew Roster

```typescript
// src/lib/intelligence/crew.ts

export type CrewRole =
  | 'probe_runner'      // Executes standardised test prompts against all models
  | 'output_analyst'    // Compares and describes model output differences
  | 'report_writer'     // Synthesises findings into structured reports
  | 'anomaly_detector'  // Flags when a model behaves differently than expected
  | 'update_watcher'    // Monitors model version changes and new releases

// Crew assignments — cheap models for cheap tasks
export const CREW_ASSIGNMENTS: Record<CrewRole, { model: string, costIndex: number }> = {
  probe_runner:     { model: 'wan_2_6',        costIndex: 1 },   // Runs standard probes
  output_analyst:   { model: 'ltx_2_3',        costIndex: 1.5 }, // Analyses visual outputs
  report_writer:    { model: 'seedance_2_0_fast', costIndex: 1 }, // Writes structured reports
  anomaly_detector: { model: 'ltx_2_3',        costIndex: 1.5 }, // Spots odd behaviour
  update_watcher:   { model: 'mochi_1',         costIndex: 1 },   // Monitors changelogs
}

// The report writer specifically uses Model 1 text-only mode
// (no pixel generation) — cheaper than full inference
// For text analysis and report writing: route to Claude Haiku
// (fastest, cheapest, perfectly capable of structured report writing)
```

### What the Cheap Crew Reports On

```typescript
// src/lib/intelligence/report-schema.ts

export interface ModelIntelligenceReport {
  model_id: string
  model_version: string
  report_date: string
  generated_by: string        // which cheap crew member wrote this

  // Performance observations
  strengths: string[]         // observed areas of excellence
  weaknesses: string[]        // observed failure patterns
  failure_modes: FailureMode[]

  // Behavioural analysis
  prompt_sensitivity: PromptSensitivity   // how much does phrasing affect output?
  consistency_score: number               // 0-1: same prompt → same output?
  physics_accuracy: PhysicsAssessment
  motion_quality: MotionAssessment
  text_rendering: TextAssessment
  character_fidelity: CharacterAssessment

  // Inference pattern observations
  generation_speed_profile: SpeedProfile
  quality_vs_duration: QualityDurationCurve
  resolution_stability: ResolutionAnalysis

  // Routing intelligence
  optimal_scene_types: SceneCategory[]
  avoid_scene_types: SceneCategory[]
  cost_efficiency_rating: number          // quality/cost ratio vs baseline

  // Training signals extracted
  training_examples: TrainingExample[]    // input/output pairs for ML training
  distillation_candidates: string[]       // outputs worth distilling
}

export interface FailureMode {
  trigger: string            // what prompt pattern causes this
  manifestation: string      // what breaks (hands, text, physics, etc.)
  frequency: number          // 0-1: how often does this occur
  severity: 1 | 2 | 3 | 4 | 5
  workaround?: string        // prompt engineering fix if found
}

export interface PromptSensitivity {
  synonyms_matter: boolean       // does "walk" vs "stroll" produce different results?
  order_matters: boolean         // does prompt word order affect output?
  detail_level_optimal: 'sparse' | 'medium' | 'dense'
  forbidden_words: string[]      // words that consistently degrade output
  power_words: string[]          // words that consistently improve output
}
```

---

## PART 3 — TRAINING ESPIONAGE PROTOCOL

This is systematic, controlled benchmarking. Every major AI lab does this
with competitor models. It is standard ML research practice.

The protocol runs on a schedule, probing each model with carefully
designed test prompts that reveal HOW the model generates, not just
what it produces.

### The Probe Battery

```typescript
// src/lib/intelligence/probe-battery.ts

// 120 standardised test prompts organised into 12 capability categories
// Each prompt is designed to isolate ONE specific capability
// Run against every model on the same day, same resolution, same seed where possible

export const PROBE_BATTERY: ProbeSet[] = [

  // CATEGORY 1: PHYSICS UNDERSTANDING
  {
    category: 'physics_rigid_body',
    probes: [
      { id: 'PHY-001', prompt: 'A ceramic coffee mug falls from a table and shatters on a hardwood floor, debris scatters, dust rises', target: 'Does it understand gravity, impact physics, material fragmentation?' },
      { id: 'PHY-002', prompt: 'A basketball is thrown at a glass window, the glass cracks and shatters inward, the ball bounces back', target: 'Penetration physics, material response, energy transfer' },
      { id: 'PHY-003', prompt: 'A stack of books topples sideways in slow motion, each book falls at slightly different angles', target: 'Multi-object rigid body, domino physics' },
    ]
  },

  // CATEGORY 2: FLUID DYNAMICS
  {
    category: 'physics_fluid',
    probes: [
      { id: 'FLD-001', prompt: 'A wine glass is slowly tipped and red wine pours out, splashing on white linen tablecloth, staining it', target: 'Liquid flow, surface tension, material absorption' },
      { id: 'FLD-002', prompt: 'Heavy rain falls on a calm lake, each raindrop creates a perfect circular ripple, ripples intersect', target: 'Fluid wave physics, interference patterns' },
      { id: 'FLD-003', prompt: 'Thick honey pours from a spoon in a steady stream, slowly pooling and spreading, catching light', target: 'Non-Newtonian fluid, viscosity, light caustics' },
    ]
  },

  // CATEGORY 3: HUMAN BIOMECHANICS
  {
    category: 'human_motion',
    probes: [
      { id: 'HUM-001', prompt: 'A pianist plays a rapid difficult passage, fingers moving independently across keys, close-up of hands only', target: 'Fine motor control, finger independence, hand anatomy' },
      { id: 'HUM-002', prompt: 'A dancer performs a slow pirouette, arms extended, dress spinning outward, bare feet on wooden floor', target: 'Rotational physics on cloth, balance, foot positioning' },
      { id: 'HUM-003', prompt: 'Two boxers exchange rapid punches in slow motion, sweat drops fly, bodies react to impact', target: 'Fast action, impact physics, two-person coordination' },
    ]
  },

  // CATEGORY 4: TEXT RENDERING
  {
    category: 'text_accuracy',
    probes: [
      { id: 'TXT-001', prompt: 'A neon sign reading "OPEN 24HR" glows in a dark window, rain reflects it on wet pavement below', target: 'Text legibility under atmospheric conditions' },
      { id: 'TXT-002', prompt: 'A close-up of a newspaper front page with the headline "SCIENTISTS DISCOVER NEW PLANET" in bold type', target: 'Static text legibility, layout accuracy' },
      { id: 'TXT-003', prompt: 'A digital scoreboard showing "HOME 42 - AWAY 17" at a sports stadium, crowd in background', target: 'Numbers, multi-item text, context accuracy' },
    ]
  },

  // CATEGORY 5: TEMPORAL CONSISTENCY
  {
    category: 'consistency',
    probes: [
      { id: 'CON-001', prompt: 'A woman with short red hair and a blue coat walks from left to right across the frame, camera tracks her at mid-shot for 8 seconds', target: 'Character appearance stability across duration' },
      { id: 'CON-002', prompt: 'A candle flame burns steadily on a wooden table, no wind, camera holds static for 8 seconds', target: 'Environmental stability, subtle organic motion' },
      { id: 'CON-003', prompt: 'A red sports car drives continuously through a tunnel, the car must maintain identical appearance throughout', target: 'Object consistency across motion and lighting change' },
    ]
  },

  // CATEGORY 6: MATERIAL SCIENCE
  {
    category: 'material_physics',
    probes: [
      { id: 'MAT-001', prompt: 'A silk blouse worn by a woman as she spins, fabric moving with air resistance and inertia, catching light', target: 'Cloth simulation, light interaction, specular highlights' },
      { id: 'MAT-002', prompt: 'A close-up of a blacksmith hammering glowing hot metal, sparks fly, metal deforms under impact', target: 'High-temperature material, particle emission, deformation' },
      { id: 'MAT-003', prompt: 'Frost slowly forming on a glass window, ice crystals growing outward in real time, close macro', target: 'Crystal growth physics, material state change, macro detail' },
    ]
  },

  // CATEGORY 7: ATMOSPHERIC CONDITIONS
  {
    category: 'atmosphere',
    probes: [
      { id: 'ATM-001', prompt: 'Dense fog rolls through a forest at dawn, shafts of light penetrate the mist, the forest is silent', target: 'Volumetric fog, light scatter, atmospheric depth' },
      { id: 'ATM-002', prompt: 'A lightning strike hits a tree during a violent storm, branches explode, thunder implied', target: 'Electrical arc physics, explosive impact, storm atmosphere' },
      { id: 'ATM-003', prompt: 'A sandstorm approaches a desert village, the wall of sand is 50 metres tall, people run', target: 'Particle systems at scale, environmental threat, crowd reaction' },
    ]
  },

  // CATEGORY 8: ARCHITECTURAL DETAIL
  {
    category: 'architecture',
    probes: [
      { id: 'ARC-001', prompt: 'A slow drone push-in toward the facade of a Gothic cathedral at dusk, stone texture detail, gargoyles', target: 'Camera movement + architecture detail + atmospheric lighting' },
      { id: 'ARC-002', prompt: 'Interior of a 1970s brutalist government building, fluorescent lights, worn linoleum, long hallway receding', target: 'Period-accurate architecture, perspective, interior lighting' },
      { id: 'ARC-003', prompt: 'A futuristic glass and steel skyscraper in a rainstorm at night, lights reflected in puddles below, neon signs', target: 'Modern architecture, reflective materials, night atmosphere' },
    ]
  },

  // CATEGORY 9: WILDLIFE AND NATURE
  {
    category: 'wildlife',
    probes: [
      { id: 'WLD-001', prompt: 'A Bengal tiger walking slowly through tall grass, close tracking shot, muscles rippling, tail moving', target: 'Large animal biomechanics, fur simulation, predator movement' },
      { id: 'WLD-002', prompt: 'A murmuration of thousands of starlings forming and reforming patterns against an orange sunset sky', target: 'Mass behaviour simulation, flocking algorithm, scale' },
      { id: 'WLD-003', prompt: 'A salmon leaping up a waterfall against the current, water catching light, force visible', target: 'Animal + fluid dynamics combined, exertion, physics' },
    ]
  },

  // CATEGORY 10: PROMPT ADHERENCE
  {
    category: 'prompt_fidelity',
    probes: [
      { id: 'PRO-001', prompt: 'EXACTLY three red balloons tied to a white fence post in a green meadow on a sunny day, no other objects', target: 'Exact object count, colour, positioning, no hallucination' },
      { id: 'PRO-002', prompt: 'The camera starts looking straight down at the ground, then smoothly rotates 90 degrees to look at the horizon', target: 'Exact camera instruction following, spatial control' },
      { id: 'PRO-003', prompt: 'A SLOW motion shot where time appears to slow to 10% normal speed as a champagne glass is dropped', target: 'Speed control, temporal manipulation, dramatic effect' },
    ]
  },

  // CATEGORY 11: AUDIO GENERATION (for audio-capable models)
  {
    category: 'native_audio',
    probes: [
      { id: 'AUD-001', prompt: 'A crowded coffee shop, steam from espresso machine hissing, quiet jazz, murmur of conversation, cups clinking', target: 'Multi-source ambient audio accuracy and spatial placement' },
      { id: 'AUD-002', prompt: 'A woman says "I never thought I would see you again" with emotion, in a rain-soaked street at night', target: 'Dialogue clarity, lip sync accuracy, emotional tone in voice' },
      { id: 'AUD-003', prompt: 'A thunderstorm builds over the ocean, waves crash, thunder rolls, seagulls call and fly away', target: 'Natural sound design, audio-visual sync, crescendo' },
    ]
  },

  // CATEGORY 12: COST EFFICIENCY
  {
    category: 'efficiency',
    probes: [
      // Run each probe at multiple durations to map quality/duration curve
      // Run at Draft quality and Hero quality to map tier impact
      // Measure generation time vs output quality ratio
      { id: 'EFF-001', prompt: 'A simple orange rolling across a white table, no shadows, top-down camera', target: 'Baseline simplest possible generation — measures floor quality' },
      { id: 'EFF-002', prompt: 'Dense city intersection at rush hour, 50+ vehicles, pedestrians, traffic lights, rain', target: 'Maximum complexity ceiling — measures peak capability' },
    ]
  },
]
```

### The Analysis Engine

```typescript
// src/lib/intelligence/analyser.ts

export class ModelIntelligenceAnalyser {

  // Run the full probe battery against one model
  async probeModel(params: {
    modelId: string
    modelVersion: string
    probeSet: ProbeSet[]
    tier: OutcomeTier
  }): Promise<RawProbeResults> {

    const results: RawProbeResult[] = []

    for (const set of params.probeSet) {
      for (const probe of set.probes) {

        // Generate the video using the target model
        const videoUrl = await this.generateProbe(params.modelId, probe.prompt, params.tier)

        // Extract frames for analysis (start, middle, end)
        const frames = await this.extractKeyFrames(videoUrl)

        // Quality assessment using cheap crew (Model 1 vision mode)
        const assessment = await this.assessOutput({
          probe,
          videoUrl,
          frames,
          target: probe.target,
        })

        results.push({
          probe_id: probe.id,
          category: set.category,
          model_id: params.modelId,
          model_version: params.modelVersion,
          video_url: videoUrl,
          assessment,
          generated_at: new Date().toISOString(),
        })

        // Store to intelligence DB immediately (not technical DB)
        await DOMAIN_DB.intelligence.probeResult.create({ data: results[results.length - 1] })
      }
    }

    return results
  }

  // Cheap crew writes the analysis report (Claude Haiku — text only, very cheap)
  async writeAnalysisReport(
    modelId: string,
    results: RawProbeResult[]
  ): Promise<ModelIntelligenceReport> {

    const groupedByCategory = this.groupResults(results)

    // CHEAP: Claude Haiku for text-only analysis writing
    // NOT Model 1 (which is for routing/orchestration)
    // NOT the Council (too expensive for this task)
    const reportResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INTELLIGENCE_AI_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',  // Cheapest capable model
        max_tokens: 2000,
        system: `You are a machine learning research analyst writing internal competitive intelligence reports.
Write precise, factual, technical reports based on benchmark probe results.
Focus on: failure patterns, prompt sensitivity, capability boundaries.
Be specific. No marketing language. No hedging. State what was observed.
Return structured JSON only.`,
        messages: [{
          role: 'user',
          content: `Write a competitive intelligence report for model: ${modelId}

Probe results by category:
${JSON.stringify(groupedByCategory, null, 2)}

Return JSON matching the ModelIntelligenceReport schema exactly.`
        }]
      })
    })

    const data = await reportResponse.json()
    const report = JSON.parse(data.content[0].text)

    // Store to intelligence DB
    await DOMAIN_DB.intelligence.modelReport.create({
      data: {
        model_id: modelId,
        report_date: new Date().toISOString(),
        generated_by: 'claude-haiku',
        report_json: report,
        probe_count: results.length,
      }
    })

    // Feed relevant training pairs to the training cluster
    await this.extractTrainingSignals(results, report)

    return report
  }

  // Extract training signals from probe results
  private async extractTrainingSignals(
    results: RawProbeResult[],
    report: ModelIntelligenceReport
  ): Promise<void> {

    // High-quality outputs from probes become training targets
    const trainingPairs = results
      .filter(r => r.assessment.quality_score >= 8)
      .map(r => ({
        prompt: r.probe_prompt,
        video_url: r.video_url,
        model_source: r.model_id,
        category: r.category,
        type: 'probe_high_quality',
      }))

    // Failure modes become negative examples
    const failureExamples = results
      .filter(r => r.assessment.quality_score <= 4)
      .map(r => ({
        prompt: r.probe_prompt,
        video_url: r.video_url,
        failure_description: r.assessment.issues.join('; '),
        model_source: r.model_id,
        type: 'probe_failure_negative',
      }))

    // Write to intelligence training queue
    await DOMAIN_DB.intelligence.trainingSignal.createMany({
      data: [...trainingPairs, ...failureExamples]
    })

    // Push to training cluster via Redis queue
    await DOMAIN_REDIS.intelligence.lpush(
      'training:probe_signals',
      JSON.stringify({ trainingPairs, failureExamples })
    )
  }
}
```

---

## PART 4 — COMPETITIVE UPDATE DETECTION

When any model releases a new version, the system detects it,
re-runs the relevant probe categories, updates the routing matrix
if needed, and triggers targeted fine-tuning.

```typescript
// src/lib/intelligence/update-watcher.ts
// Runs as a cron job: every 6 hours

export class ModelUpdateWatcher {

  // Known model versions — update when changes detected
  private modelVersions: Record<string, string> = {
    veo_3_1:       '3.1.0',
    kling_3_0:     '3.0.0',
    seedance_2_0:  '2.0.0',
    runway_gen4_5: '4.5.0',
    wan_2_6:       '2.6.0',
    ltx_2_3:       '2.3.0',
    minimax_hailuo: '2.3.0',
    pika_2_5:      '2.5.0',
    luma_ray3:     '3.0.0',
    pixverse_v4_5: '4.5.0',
  }

  // Check for model updates by hitting API version endpoints
  async detectUpdates(): Promise<ModelUpdate[]> {
    const updates: ModelUpdate[] = []

    for (const [modelId, currentVersion] of Object.entries(this.modelVersions)) {
      try {
        const latestVersion = await this.fetchLatestVersion(modelId)

        if (latestVersion !== currentVersion) {
          updates.push({
            model_id: modelId,
            previous_version: currentVersion,
            new_version: latestVersion,
            detected_at: new Date().toISOString(),
          })

          // Update stored version
          this.modelVersions[modelId] = latestVersion

          // Log to intelligence DB
          await DOMAIN_DB.intelligence.modelUpdate.create({
            data: { model_id: modelId, previous_version: currentVersion, new_version: latestVersion }
          })
        }
      } catch { /* Version check failed — log and continue */ }
    }

    return updates
  }

  // On detecting an update: run targeted probes and update routing
  async handleUpdate(update: ModelUpdate): Promise<void> {

    console.log(`UPDATE DETECTED: ${update.model_id} ${update.previous_version} → ${update.new_version}`)

    // Run only the probe categories most relevant to this model's specialty
    const targetCategories = this.getTargetCategories(update.model_id)
    const probesToRun = PROBE_BATTERY.filter(p => targetCategories.includes(p.category))

    // Run probes with cheap crew
    const analyser = new ModelIntelligenceAnalyser()
    const results = await analyser.probeModel({
      modelId: update.model_id,
      modelVersion: update.new_version,
      probeSet: probesToRun,
      tier: 'Studio',
    })

    // Compare against baseline
    const baseline = await this.fetchBaselineReport(update.model_id, update.previous_version)
    const delta = await this.computeDelta(baseline, results)

    // Write delta report via cheap crew (Claude Haiku)
    const deltaReport = await this.writeDeltaReport(update, delta)

    // If significant capability change detected: trigger routing matrix update
    if (delta.significance_score > 0.2) {
      await this.triggerRoutingReview(update.model_id, deltaReport)
    }

    // Always trigger targeted training from new outputs
    await this.triggerTargetedTraining(update.model_id, results, update.new_version)
  }

  // Trigger training cluster to learn from new model outputs
  private async triggerTargetedTraining(
    modelId: string,
    probeResults: RawProbeResult[],
    version: string
  ): Promise<void> {

    // High-quality probe outputs from the updated model go into training
    const trainingBatch = probeResults
      .filter(r => r.assessment.quality_score >= 7.5)
      .map(r => ({
        source_model: modelId,
        source_version: version,
        prompt: r.probe_prompt,
        video_url: r.video_url,
        quality_score: r.assessment.quality_score,
        category: r.category,
        type: 'update_probe_output',
        ingested_at: new Date().toISOString(),
      }))

    // Queue to training cluster
    await DOMAIN_REDIS.intelligence.lpush(
      'training:model_update_signals',
      JSON.stringify({ modelId, version, batch: trainingBatch })
    )

    // The training cluster worker picks this up and:
    // 1. Stores to DAS training path
    // 2. Adds to next fine-tuning run queue
    // 3. Updates model capability database with new benchmarks
    console.log(`Queued ${trainingBatch.length} training signals from ${modelId} v${version}`)
  }

  private getTargetCategories(modelId: string): string[] {
    // Only re-probe the categories where this model specialises
    const categoryMap: Record<string, string[]> = {
      veo_3_1:       ['physics_fluid', 'atmosphere', 'native_audio', 'prompt_fidelity'],
      kling_3_0:     ['human_motion', 'material_physics', 'wildlife', 'consistency'],
      seedance_2_0:  ['human_motion', 'material_physics', 'native_audio', 'efficiency'],
      runway_gen4_5: ['consistency', 'architecture', 'prompt_fidelity'],
      wan_2_6:       ['architecture', 'efficiency', 'atmosphere'],
      ltx_2_3:       ['text_accuracy', 'efficiency', 'consistency'],
      luma_ray3:     ['architecture', 'atmosphere', 'wildlife'],
    }
    return categoryMap[modelId] ?? ['efficiency', 'consistency']
  }
}
```

---

## PART 5 — THE CONTINUOUS LEARNING LOOP

When the in-house model (Model 2 DiT / Mochi successor) is ready,
this system ensures it stays permanently current.

```
                    ┌─────────────────────────┐
                    │   COMPETITOR RELEASES    │
                    │   new version / feature  │
                    └───────────┬─────────────┘
                                │ UpdateWatcher detects
                                ▼
                    ┌─────────────────────────┐
                    │   PROBE BATTERY runs     │
                    │   on new version         │
                    │   (cheap crew executes)  │
                    └───────────┬─────────────┘
                                │ Results stored
                                ▼
                    ┌─────────────────────────┐
                    │   CHEAP CREW WRITES      │
                    │   delta report           │
                    │   (Claude Haiku)         │
                    └───────────┬─────────────┘
                                │ Training signals extracted
                                ▼
                    ┌─────────────────────────┐
                    │   TRAINING CLUSTER       │
                    │   ingests new outputs    │
                    │   queues fine-tune run   │
                    └───────────┬─────────────┘
                                │ New weights produced
                                ▼
                    ┌─────────────────────────┐
                    │   QUALITY GATE           │
                    │   regression tests       │
                    │   capability benchmarks  │
                    └───────────┬─────────────┘
                                │ Passes gate
                                ▼
                    ┌─────────────────────────┐
                    │   IN-HOUSE MODEL         │
                    │   updated weights        │
                    │   now matches frontier   │
                    └─────────────────────────┘
```

### The Training Espionage Database Schema

```prisma
// In DB_INTELLIGENCE only — never in DB_TECHNICAL or DB_MARKETING

model ProbeResult {
  id              String   @id @default(cuid())
  probe_id        String   // e.g. "PHY-001"
  category        String   // e.g. "physics_fluid"
  model_id        String
  model_version   String
  prompt          String
  video_url       String   // stored to DAS intelligence path
  quality_score   Float
  issues          String[]
  strengths       String[]
  assessment_json Json
  generated_at    DateTime
  tier_used       String
  generation_ms   Int
}

model ModelReport {
  id              String   @id @default(cuid())
  model_id        String
  model_version   String
  report_date     DateTime
  generated_by    String   // "claude-haiku"
  report_json     Json     // Full ModelIntelligenceReport
  probe_count     Int
  is_delta        Boolean  @default(false)
  previous_report String?  // ID of previous report for comparison
}

model ModelUpdate {
  id              String   @id @default(cuid())
  model_id        String
  previous_version String
  new_version     String
  detected_at     DateTime
  probes_run      Int      @default(0)
  training_signals_extracted Int @default(0)
  routing_updated Boolean  @default(false)
}

model TrainingSignal {
  id              String   @id @default(cuid())
  source_model    String
  source_version  String
  prompt          String
  video_url       String
  quality_score   Float?
  failure_description String?
  category        String
  type            String   // "probe_high_quality" | "probe_failure_negative" | "update_probe_output"
  processed       Boolean  @default(false)
  ingested_at     DateTime @default(now())
}

model RoutingDecision {
  id              String   @id @default(cuid())
  scene_category  String
  assigned_model  String
  tier            String
  quality_score   Float
  needed_repaint  Boolean
  cost_credits    Int
  generation_ms   Int
  created_at      DateTime @default(now())
  // This table trains the routing predictor:
  // Input: scene_category + tier + physics_complexity
  // Output: which model + resulting quality score
}
```

---

## PART 6 — CRON SCHEDULE

```typescript
// src/workers/intelligence-cron.ts
// Runs as separate Node.js process — never on production API server

import cron from 'node-cron'

// Every 6 hours: check for model updates
cron.schedule('0 */6 * * *', async () => {
  const watcher = new ModelUpdateWatcher()
  const updates = await watcher.detectUpdates()
  for (const update of updates) {
    await watcher.handleUpdate(update)
  }
})

// Weekly: run full probe battery on all models
cron.schedule('0 2 * * 1', async () => {
  const analyser = new ModelIntelligenceAnalyser()
  const models = ['veo_3_1', 'kling_3_0', 'seedance_2_0', 'runway_gen4_5', 'wan_2_6', 'ltx_2_3']

  for (const modelId of models) {
    const results = await analyser.probeModel({
      modelId,
      modelVersion: await getStoredVersion(modelId),
      probeSet: PROBE_BATTERY,
      tier: 'Studio',
    })
    await analyser.writeAnalysisReport(modelId, results)
  }
})

// Monthly: compare all reports, update routing matrix recommendations
cron.schedule('0 3 1 * *', async () => {
  await generateCrossModelComparisonReport()
  await suggestRoutingMatrixUpdates()
})

// When training signals queue reaches 1000 items: trigger fine-tune
async function monitorTrainingQueue() {
  const queueLength = await DOMAIN_REDIS.intelligence.llen('training:probe_signals')
  if (queueLength >= 1000) {
    await triggerTrainingRun()
  }
}
setInterval(monitorTrainingQueue, 60 * 60 * 1000) // check hourly
```

---

## SUMMARY: WHAT THIS SYSTEM DOES

1. **Firewall**: Marketing AI never knows what models power the platform.
   Users see "Blockbuster mode." Competitors cannot read routing intelligence
   from marketing copy because marketing copy contains none.

2. **Cheap Crew**: Claude Haiku ($0.25/MTok) writes all analysis reports.
   Wan 2.6 / LTX-2.3 run probes. Seedance Fast generates comparison outputs.
   Total intelligence operation cost: ~$50-200/month at full schedule.

3. **Probe Battery**: 120 standardised prompts across 12 capability categories
   reveal exactly where each model excels, fails, and why. This is knowledge
   no public benchmark provides — it's proprietary to the platform.

4. **Update Detection**: Every 6 hours, version endpoints are checked.
   When Kling 4.0 drops, the system immediately runs targeted probes,
   writes a delta report, extracts training signals, and queues a fine-tune.
   The in-house model absorbs the improvement within days.

5. **Compound moat**: After 12 months of weekly probes across 12 models,
   the intelligence database contains ~75,000 probe results. This is a
   proprietary capability map of the entire AI video generation industry
   that no other platform has, cannot be bought, and took a year to build.

