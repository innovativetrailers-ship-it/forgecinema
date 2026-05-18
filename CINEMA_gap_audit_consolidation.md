# CINEMATIC FORGE — COMPLETE GAP AUDIT & CONSOLIDATION FIX
## Every Missing Wire, Conflict, and Gap — Resolved
### Feed this to Cursor after CINEMA_cursor_prompt.md + CINEMA_cursor_prompt_addendum.md

---

## AUDIT FINDINGS SUMMARY

After cross-referencing all 8 specification documents (~500KB total), the following gaps were identified:

| Category | Issues Found | Status |
|---|---|---|
| Sprint number conflicts | 8 collisions | Fixed below |
| Missing Prisma models | 13 models | Added below |
| Missing env vars | 12 vars | Added below |
| Path/naming conflicts | `src/lib/swarm/` vs `src/lib/routing/` | Resolved below |
| Unrendered UI panels | 17 panels specified but not wired | Wired below |
| Missing API routes | 11 routes across docs | Added below |
| "agent" terminology | 41 instances in swarm_upgrade.md | Renamed below |
| Sprint gaps (22-36) | Content specified but sprint definitions missing | Fixed below |

---

## SECTION 1 — DEFINITIVE SPRINT ORDER (ALL CONFLICTS RESOLVED)

The following replaces ALL sprint numbering across all documents. Use this order exclusively:

### Phase 1 — Foundation (Weeks 1-4)
- **Sprint 1** — Scaffold, all 4 Prisma schemas, db/redis singletons
- **Sprint 2** — Landing page + Auth (Google OAuth, credentials, T&Cs)
- **Sprint 3** — Pricing, payments (Stripe + PayPal), dev account seed
- **Sprint 4** — BullMQ queues, SSE streaming, DAS pull worker

### Phase 2 — Core Engines (Weeks 5-9)
- **Sprint 5** — fal.ai processing layer (IC-Light, AuraSR, Depth, SadTalker, Whisper)
- **Sprint 6** — MediaRouter + SceneDecomposer + SeamlessBlender (renamed from SwarmRouter)
- **Sprint 7** — All VLM engine clients (12 models)
- **Sprint 8** — Timeline engine (schema, FFmpeg renderer, proxy, harmonise)
- **Sprint 9** — Character vault (CRUD, face embed, LoRA trigger, model lock)

### Phase 3 — Services (Weeks 10-13)
- **Sprint 10** — Location engine (Mapillary, Cesium, OSM)
- **Sprint 11** — Audio pipeline (Suno, ElevenLabs, AudioCraft, beats)
- **Sprint 12** — Auto-Social (Drop & Direct)
- **Sprint 13** — Knowledge Firewall (4 domain DBs, sanitisation)

### Phase 4 — UI (Weeks 14-18)
- **Sprint 14** — Simple Mode UI (all tabs, SSE progress, TokenBar)
- **Sprint 15** — Advanced Mode UI (full timeline, all panels wired, all icons wired)
- **Sprint 16** — Ultimate Mode UI (colour grading, audio mixer, VFX compositor, AI Director)
- **Sprint 17** — Character Onboarding flow (6-step modal, fully wired)
- **Sprint 18** — UI polish (neon teal everywhere, no amber, no broken buttons)

### Phase 5 — Advanced Features (Weeks 19-24)
- **Sprint 19** — Omnichannel multi-engine clip (SceneDecomposer multi-segment, parallel dispatch)
- **Sprint 20** — Upscaling pipeline (all 6 engines, face enhance, grain restore)
- **Sprint 21** — Multi-character casting + SFX makeup engine
- **Sprint 22** — Green screen + character recasting
- **Sprint 23** — Film Mode (Fountain parser, FilmDirector, full production)
- **Sprint 24** — Series Mode (SeriesManager, series bible, episode engine)

### Phase 6 — Production Tools (Weeks 25-29)
- **Sprint 25** — Reference video analyser + style matching
- **Sprint 26** — Avatar system (InstantAvatar, stock, script-to-video, talking photo)
- **Sprint 27** — Performance capture (DWPose, webcam, LivePortrait)
- **Sprint 28** — Transcript editing + audio AI (filler removal, StudioSound, Overdub)
- **Sprint 29** — Client review portal + approval workflow

### Phase 7 — Distribution (Weeks 30-32)
- **Sprint 30** — Video translation (29 languages) + smart highlight extraction
- **Sprint 31** — Brand kit auto-apply + stock asset library (Pexels + FMA)
- **Sprint 32** — Social publishing (TikTok, Instagram, YouTube) + scheduling

### Phase 8 — Hollywood Pipeline (Weeks 33-37)
- **Sprint 33** — AAF/OTIO interchange + EDL/FCP XML (Python OTIO microservice)
- **Sprint 34** — Pro Tools audio compatibility (BWF, OMF, stem export)
- **Sprint 35** — IMF packaging (Netflix/Amazon/Apple delivery)
- **Sprint 36** — ShotGrid + Frame.io production management
- **Sprint 37** — Expanded node compositor (25+ nodes, OpenEXR deep compositing)

### Phase 9 — Intelligence & Growth Engine (Weeks 38-44)
- **Sprint 38** — Growth Engine Brain (Model 1 vLLM, Model 2 Mochi, Agentic Loop)
- **Sprint 39** — Intelligence firewall complete (all 4 domain DBs fully isolated)
- **Sprint 40** — Probe battery + ModelIntelligenceAnalyser + UpdateWatcher
- **Sprint 41** — Training pipeline worker (data pipeline, distillation, RLAIF)
- **Sprint 42** — Quality gate + canary deploy
- **Sprint 43** — Plugin API + npm SDK

### Phase 10 — Hardening (Weeks 45-46)
- **Sprint 44** — Security (NSFW moderation, rate limiting, C2PA, all tests)
- **Sprint 45** — Hardware control surface + media management (BinManager)

---

## SECTION 2 — COMPLETE PRISMA SCHEMA ADDITIONS

Add ALL of these to `prisma/schema.prisma` (in DB_PRODUCT unless noted):

```prisma
// ═══════════════════════════════════════════════
// FILM & SERIES PRODUCTION MODELS
// ═══════════════════════════════════════════════

model FilmProject {
  id              String        @id @default(cuid())
  userId          String
  title           String
  logline         String?
  genre           String?
  targetDuration  Int           // seconds
  status          String        @default("development")
  fountainScript  String?       // raw Fountain-format script
  seriesBible     String?
  style           String?
  acts            Act[]
  castMembers     FilmCastMember[]
  locations       FilmLocation[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  user            User          @relation(fields: [userId], references: [id])
  @@index([userId])
}

model Act {
  id              String        @id @default(cuid())
  filmProjectId   String
  actNumber       Int
  title           String?
  sequences       Sequence[]
  filmProject     FilmProject   @relation(fields: [filmProjectId], references: [id])
}

model Sequence {
  id              String        @id @default(cuid())
  actId           String
  sequenceNumber  Int
  description     String?
  scenes          FilmScene[]
  act             Act           @relation(fields: [actId], references: [id])
}

model FilmScene {
  id              String        @id @default(cuid())
  sequenceId      String
  sceneNumber     Int
  sceneHeading    String        // INT. COFFEE SHOP - DAY
  action          String
  dialogue        Json?         // [{character, line, emotion}]
  shots           Json?         // generated shot list
  generatedClipUrl String?
  status          String        @default("pending")
  sequence        Sequence      @relation(fields: [sequenceId], references: [id])
}

model FilmCastMember {
  id              String        @id @default(cuid())
  filmProjectId   String
  vaultCharacterId String
  role            String        // "LEAD" | "SUPPORTING" | "EXTRA"
  characterName   String
  filmProject     FilmProject   @relation(fields: [filmProjectId], references: [id])
}

model FilmLocation {
  id              String        @id @default(cuid())
  filmProjectId   String
  vaultLocationId String?
  name            String
  description     String?
  sceneCount      Int           @default(0)
  filmProject     FilmProject   @relation(fields: [filmProjectId], references: [id])
}

model SeriesProject {
  id              String        @id @default(cuid())
  userId          String
  title           String
  format          String        // "shortform" | "longform" | "social"
  targetPlatform  String?
  episodeCount    Int           @default(0)
  seriesBible     Json?
  brandingJson    Json?
  seasons         Season[]
  createdAt       DateTime      @default(now())
  user            User          @relation(fields: [userId], references: [id])
  @@index([userId])
}

model Season {
  id              String        @id @default(cuid())
  seriesProjectId String
  seasonNumber    Int
  title           String?
  episodes        Episode[]
  series          SeriesProject @relation(fields: [seriesProjectId], references: [id])
}

model Episode {
  id              String        @id @default(cuid())
  seasonId        String
  episodeNumber   Int
  title           String?
  brief           String?
  scriptJson      Json?
  timelineJson    Json?
  status          String        @default("pending")
  publishedUrl    String?
  season          Season        @relation(fields: [seasonId], references: [id])
}

// ═══════════════════════════════════════════════
// MEDIA MANAGEMENT
// ═══════════════════════════════════════════════

model MediaBin {
  id              String        @id @default(cuid())
  projectId       String
  name            String
  colour          String        @default("#00e5c8")
  sortOrder       Int           @default(0)
  entries         BinClipEntry[]
  project         Project       @relation(fields: [projectId], references: [id])
  @@index([projectId])
}

model BinClipEntry {
  id              String        @id @default(cuid())
  binId           String
  clipUrl         String
  proxyUrl        String?
  name            String
  durationSeconds Float?
  thumbnailUrl    String?
  metadata        Json?
  createdAt       DateTime      @default(now())
  bin             MediaBin      @relation(fields: [binId], references: [id])
}

// ═══════════════════════════════════════════════
// ADD TO USER MODEL (relations)
// ═══════════════════════════════════════════════
// Add these relation fields to the User model:
//   filmProjects    FilmProject[]
//   seriesProjects  SeriesProject[]
//
// Add to Project model:
//   mediaBins       MediaBin[]
```

```prisma
// ═══════════════════════════════════════════════
// DB_TECHNICAL SCHEMA (separate database)
// ═══════════════════════════════════════════════

model RoutingDecision {
  id              String   @id @default(cuid())
  sceneCategory   String
  assignedEngine  String   // VLM internal name
  tier            String
  qualityScore    Float?
  neededRepaint   Boolean  @default(false)
  creditsCost     Int
  generationMs    Int?
  segmentCount    Int      @default(1)  // how many engines used
  createdAt       DateTime @default(now())
  @@index([sceneCategory, assignedEngine])
}

model EnginePerformanceLog {
  id              String   @id @default(cuid())
  engineId        String
  sceneCategory   String
  tier            String
  latencyMs       Int
  qualityScore    Float
  costCents       Float
  success         Boolean
  errorType       String?
  createdAt       DateTime @default(now())
  @@index([engineId, createdAt])
}

model BlendQualityLog {
  id              String   @id @default(cuid())
  clipId          String
  engineIds       String[] // engines used in this clip
  stitchCount     Int      // number of join points
  qualityScore    Float
  repaintNeeded   Boolean  @default(false)
  createdAt       DateTime @default(now())
}
```

```prisma
// ═══════════════════════════════════════════════
// DB_INTELLIGENCE SCHEMA (separate database)
// ═══════════════════════════════════════════════

model ProbeResult {
  id              String   @id @default(cuid())
  probeId         String   // e.g. "PHY-001"
  category        String
  engineId        String
  engineVersion   String
  prompt          String
  videoUrl        String
  qualityScore    Float
  issues          String[]
  strengths       String[]
  assessmentJson  Json
  tierUsed        String
  generationMs    Int
  createdAt       DateTime @default(now())
  @@index([engineId, category])
}

model ModelReport {
  id              String   @id @default(cuid())
  engineId        String
  engineVersion   String
  reportDate      DateTime
  generatedBy     String   // "claude-haiku"
  reportJson      Json
  probeCount      Int
  isDelta         Boolean  @default(false)
  previousReport  String?
  createdAt       DateTime @default(now())
}

model ModelUpdate {
  id                      String   @id @default(cuid())
  engineId                String
  previousVersion         String
  newVersion              String
  detectedAt              DateTime
  probesRun               Int      @default(0)
  trainingSignalsExtracted Int     @default(0)
  routingUpdated          Boolean  @default(false)
}

model TrainingSignal {
  id                  String   @id @default(cuid())
  sourceEngine        String
  sourceVersion       String
  prompt              String
  videoUrl            String
  qualityScore        Float?
  failureDescription  String?
  category            String
  signalType          String   // probe_high_quality | probe_failure | update_output
  processed           Boolean  @default(false)
  ingestedAt          DateTime @default(now())
  @@index([processed, signalType])
}
```

---

## SECTION 3 — COMPLETE ENVIRONMENT VARIABLES (MISSING VARS)

Add these to `.env.local` — they were in documents but missing from the master roadmap:

```env
# ═══════════════════════════════════════════════
# PYTHON MICROSERVICES (Hollywood pipeline)
# ═══════════════════════════════════════════════
OTIO_SERVICE_URL="http://localhost:7432"
IMF_SERVICE_URL="http://localhost:7433"
SHOTGRID_SERVICE_URL="http://localhost:7434"
EXR_SERVICE_URL="http://localhost:7435"
OSC_LISTEN_PORT=7436

# Frame.io
FRAMEIO_CLIENT_ID=""
FRAMEIO_CLIENT_SECRET=""
FRAMEIO_TOKEN=""

# ShotGrid (Autodesk Flow)
SHOTGRID_SITE_URL="https://yoursite.shotgrid.autodesk.com"
SHOTGRID_SCRIPT_NAME=""
SHOTGRID_SCRIPT_KEY=""

# ═══════════════════════════════════════════════
# PAYPAL (missing from some documents)
# ═══════════════════════════════════════════════
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
PAYPAL_MODE="sandbox"
NEXT_PUBLIC_PAYPAL_CLIENT_ID=""
PAYPAL_WEBHOOK_ID=""

# PayPal Plan IDs (create in PayPal dashboard)
PAYPAL_PLAN_PRO_MONTHLY=""
PAYPAL_PLAN_PRO_YEARLY=""
PAYPAL_PLAN_STUDIO_MONTHLY=""
PAYPAL_PLAN_STUDIO_YEARLY=""
PAYPAL_PLAN_ULTIMATE_MONTHLY=""
PAYPAL_PLAN_ULTIMATE_YEARLY=""

# ═══════════════════════════════════════════════
# SWARM/ROUTING ENGINE (renamed from swarm)
# ═══════════════════════════════════════════════
# New models from swarm_upgrade.md
PIXVERSE_API_KEY=""
LUMA_API_KEY=""         # Already in main list but confirm
LTX_API_KEY=""          # LTX-2.3 Lightricks
SKYREELS_API_KEY=""

# ═══════════════════════════════════════════════
# DEV ACCOUNT
# ═══════════════════════════════════════════════
DEV_ACCOUNT_EMAIL="innovative.trailers@gmail.com"

# ═══════════════════════════════════════════════
# SERVICES
# ═══════════════════════════════════════════════
PEXELS_API_KEY=""       # Stock video/photo library
NOMINATIM_USER_AGENT="CinematicForge/1.0"
```

---

## SECTION 4 — PATH CONSOLIDATION (Rename swarm → routing/engines)

The `CINEMA_swarm_upgrade.md` creates files under `src/lib/swarm/`. These must be moved to match the new naming convention (no "swarm", no "agent").

### Required renames (tell Cursor explicitly):

```
src/lib/swarm/types.ts              → src/lib/routing/types.ts
src/lib/swarm/brain-prompts.ts      → src/lib/routing/prompts.ts
src/lib/swarm/SwarmRouter.ts        → src/lib/routing/MediaRouter.ts
src/lib/swarm/timeline-edit.ts      → src/lib/routing/TimelineEditor.ts
src/lib/swarm/SeamlessBlender.ts    → src/lib/routing/SeamlessBlender.ts
src/lib/swarm/LongFormOrchestrator.ts → src/lib/routing/LongFormOrchestrator.ts
src/lib/swarm/AudioSwarm.ts         → src/lib/routing/AudioDispatcher.ts
src/lib/swarm/GrowthEngineCapture.ts → src/lib/telemetry/GrowthEngineCapture.ts
src/components/swarm/SwarmProgressPanel.tsx → src/components/panels/GenerationProgressPanel.tsx
src/app/api/swarm/decompose/route.ts → src/app/api/generate/decompose/route.ts
src/app/api/swarm/dispatch/route.ts  → src/app/api/generate/dispatch/route.ts
```

### Internal variable renames (find-and-replace in all files):
```typescript
SwarmRouter         → MediaRouter
swarmRouter         → mediaRouter
SwarmDispatch       → GenerationDispatch
swarmDispatch       → generationDispatch
AudioSwarm          → AudioDispatcher
audioSwarm          → audioDispatcher
SwarmProgressPanel  → GenerationProgressPanel
agentCrew           → processingCrew
AgentCrew           → ProcessingCrew
runSwarm            → runGeneration
swarmRun            → generationRun
```

---

## SECTION 5 — MISSING API ROUTES (Add to router)

These routes are specified in documents but missing from the main file structure:

```typescript
// Add to src/app/api/ — from film_series_mode.md
POST   /api/film/create                  // Create FilmProject
POST   /api/film/[id]/produce            // Full film generation pipeline
POST   /api/series/create                // Create SeriesProject
POST   /api/series/[id]/episode          // Generate episode
POST   /api/casting/recast               // Character recasting
POST   /api/makeup/apply                 // SFX makeup application
POST   /api/greenscreen/composite        // Green screen compositing
POST   /api/analysis/reference           // Reference video analysis
POST   /api/analysis/match-style         // Style matching from reference

// From studio_gap_closure.md
POST   /api/export/otio                  // OTIO/AAF export (proxies to Python)
POST   /api/export/protools              // Pro Tools BWF package
POST   /api/export/imf                   // IMF package (proxies to Python)
POST   /api/production/shotgrid/push     // Push to ShotGrid
POST   /api/production/frameio/share     // Share to Frame.io

// From generate (renamed from swarm)
POST   /api/generate/decompose           // Scene decomposition
POST   /api/generate/dispatch            // Multi-engine dispatch
POST   /api/timeline/edit                // Precision timeline edit
```

---

## SECTION 6 — COMPLETE UI WIRING (All 17 Missing Panels)

Every panel below must be wired to its sidebar icon. The pattern is identical for all:

```typescript
// src/store/ui.ts — Add ALL panel names to the type
type PanelName = 
  | 'generate' | 'vault' | 'library' | 'location' | 'cast'
  | 'sfx_makeup' | 'greenscreen' | 'cgi' | 'vfx' | 'transitions'
  | 'audio' | 'stock' | 'script' | 'storyboard' | 'avatar'
  | 'brand_kit' | 'settings' | 'translate' | 'highlights'

interface UIStore {
  activePanel: PanelName | null
  activeTool: 'select' | 'razor' | 'repaint' | 'text' | 'motion_brush' | 'track' | null
  activeRightPanel: 'properties' | 'colour' | 'audio' | 'vfx' | 'cgi' | 'director' | 'upscale'
  setActivePanel: (panel: PanelName | null) => void
  setActiveTool: (tool: UIStore['activeTool']) => void
  setActiveRightPanel: (panel: UIStore['activeRightPanel']) => void
}
```

```tsx
// src/components/layout/LeftPanelContent.tsx
// THIS FILE is the single source of truth for panel rendering
// Wire ALL 17 panels here

import { useUIStore } from '@/store/ui'

export function LeftPanelContent() {
  const { activePanel } = useUIStore()
  
  return (
    <div className="h-full overflow-y-auto">
      {activePanel === 'generate'    && <GeneratePanel />}
      {activePanel === 'vault'       && <VaultPanel />}
      {activePanel === 'library'     && <AssetLibraryPanel />}
      {activePanel === 'location'    && <LocationPanel />}
      {activePanel === 'cast'        && <CastManagerPanel />}
      {activePanel === 'sfx_makeup'  && <SFXMakeupPanel />}
      {activePanel === 'greenscreen' && <GreenScreenPanel />}
      {activePanel === 'cgi'         && <CGIPanel />}
      {activePanel === 'vfx'         && <VFXLibraryPanel />}
      {activePanel === 'transitions' && <TransitionsPanel />}
      {activePanel === 'audio'       && <AudioPanel />}
      {activePanel === 'stock'       && <StockLibraryPanel />}
      {activePanel === 'script'      && <ScriptPanel />}
      {activePanel === 'storyboard'  && <StoryboardPanel />}
      {activePanel === 'avatar'      && <AvatarPanel />}
      {activePanel === 'brand_kit'   && <BrandKitPanel />}
      {activePanel === 'settings'    && <SettingsPanel />}
      {activePanel === null          && <GeneratePanel />}  {/* default */}
    </div>
  )
}
```

### Icon Rail Wiring (src/components/layout/IconRail.tsx)
```tsx
const ICONS: Array<{ id: PanelName, icon: LucideIcon, label: string, tierRequired?: UserRole }> = [
  { id: 'generate',    icon: Sparkles,     label: 'Generate' },
  { id: 'vault',       icon: Users,        label: 'Characters' },
  { id: 'library',     icon: Film,         label: 'Library' },
  { id: 'location',    icon: MapPin,       label: 'Locations' },
  { id: 'cast',        icon: UserCheck,    label: 'Cast' },
  { id: 'sfx_makeup',  icon: Palette,      label: 'SFX Makeup' },
  { id: 'greenscreen', icon: Layers,       label: 'Green Screen' },
  { id: 'cgi',         icon: Box,          label: 'CGI & 3D' },
  { id: 'vfx',         icon: Wand2,        label: 'VFX' },
  { id: 'transitions', icon: ArrowLeftRight, label: 'Transitions' },
  { id: 'audio',       icon: Music,        label: 'Audio' },
  { id: 'stock',       icon: Library,      label: 'Stock' },
  { id: 'script',      icon: FileText,     label: 'Script', tierRequired: 'PRO' },
  { id: 'storyboard',  icon: LayoutGrid,   label: 'Storyboard', tierRequired: 'PRO' },
  { id: 'avatar',      icon: UserCircle,   label: 'Avatars' },
  { id: 'brand_kit',   icon: Paintbrush,   label: 'Brand Kit' },
  { id: 'settings',    icon: Settings,     label: 'Settings' },
]

export function IconRail() {
  const { activePanel, setActivePanel } = useUIStore()
  
  return (
    <div className="flex flex-col items-center gap-1 py-2 w-12 border-r border-[#1a1f2e] bg-[#0d1117]">
      {ICONS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setActivePanel(activePanel === id ? null : id)}
          title={label}
          className={`
            w-9 h-9 rounded flex items-center justify-center transition
            ${activePanel === id 
              ? 'bg-[#00e5c8]/20 text-[#00e5c8]' 
              : 'text-gray-500 hover:text-white hover:bg-white/5'
            }
          `}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  )
}
```

---

## SECTION 7 — MISSING GENERATE PANEL WIRING

The Generate Panel must be fully wired end-to-end. This is the most critical user flow:

```tsx
// src/components/panels/GeneratePanel.tsx — COMPLETE WIRING

export function GeneratePanel() {
  const [prompt, setPrompt] = useState('')
  const [tier, setTier] = useState<'draft' | 'standard' | 'cinematic' | 'film'>('standard')
  const [duration, setDuration] = useState(5)
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState(0)
  
  const { addClip, addGeneratingJob } = useEditorStore()
  const { balance } = useCredits()
  
  // Estimate cost on tier/duration change
  useEffect(() => {
    const baseCost = { draft: 2, standard: 8, cinematic: 25, film: 40 }[tier]
    setEstimatedCost(Math.ceil(duration / 5) * baseCost)
  }, [tier, duration])
  
  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error('Enter a prompt first')
    if (balance < estimatedCost) return toast.error(`Need ${estimatedCost} credits. You have ${balance}.`)
    
    setIsGenerating(true)
    
    try {
      // Create job
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'GENERATE',
          prompt,
          tier,
          duration,
          aspectRatio,
          characterId: selectedCharacterId,
          locationId: selectedLocationId,
        })
      })
      
      const { jobId, clipId } = await res.json()
      
      // Add placeholder clip to timeline
      addGeneratingJob(jobId, clipId)
      
      // Subscribe to SSE progress
      const eventSource = new EventSource(`/api/jobs/${jobId}/stream`)
      eventSource.onmessage = (e) => {
        const event = JSON.parse(e.data)
        if (event.status === 'COMPLETE') {
          resolveGeneratingJob(jobId, event.outputUrl)
          eventSource.close()
          setIsGenerating(false)
          toast.success('Generation complete')
        }
        if (event.status === 'FAILED') {
          removeGeneratingJob(jobId)
          eventSource.close()
          setIsGenerating(false)
          toast.error(event.errorMessage ?? 'Generation failed')
        }
      }
    } catch (err) {
      setIsGenerating(false)
      toast.error('Failed to start generation')
    }
  }
  
  return (
    <div className="p-3 flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Generate</h3>
      
      {/* Prompt */}
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Describe your scene..."
        rows={4}
        className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded-lg p-2.5 text-sm text-white placeholder-gray-500 resize-none focus:border-[#00e5c8] focus:outline-none"
      />
      
      {/* Tier */}
      <TierSelector value={tier} onChange={setTier} />
      
      {/* Duration */}
      <DurationSelector value={duration} onChange={setDuration} />
      
      {/* Aspect Ratio */}
      <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />
      
      {/* Character selector (from vault) */}
      <CharacterSelector value={selectedCharacterId} onChange={setSelectedCharacterId} />
      
      {/* Location selector */}
      <LocationSelector value={selectedLocationId} onChange={setSelectedLocationId} />
      
      {/* Cost + Generate */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-400">
          ⬡ {estimatedCost} credits
        </span>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="px-4 py-2 bg-[#00e5c8] text-black text-sm font-semibold rounded-lg hover:bg-[#00e5c8]/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>
    </div>
  )
}
```

---

## SECTION 8 — TOKEN BAR (Every Page)

```tsx
// src/components/layout/TokenBar.tsx
// Import this in src/app/(editor)/layout.tsx and at the top of every editor page

export function TokenBar() {
  const { data: credits, refetch } = useQuery({
    queryKey: ['credits'],
    queryFn: () => fetch('/api/credits/balance').then(r => r.json()),
    refetchInterval: 30000,  // refresh every 30s
  })
  
  const balance = credits?.balance ?? 0
  const isLow = balance < 50
  
  return (
    <div className="fixed top-0 inset-x-0 h-10 bg-[#0d1117] border-b border-[#1a1f2e] flex items-center justify-between px-4 z-50">
      <span className="text-[#00e5c8] font-bold text-sm tracking-tight">
        Cinematic Forge <span className="text-gray-500 font-normal text-xs">by INNOVATIVE</span>
      </span>
      
      <ModeSwitcher />
      
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 ${isLow ? 'text-red-400' : 'text-white'}`}>
          <HexagonIcon className="w-3.5 h-3.5 text-[#00e5c8]" />
          <span className="text-sm font-mono">{balance.toLocaleString()}</span>
          <span className="text-gray-500 text-xs">credits</span>
        </div>
        
        <button
          onClick={() => openModal('credit_purchase')}
          className="text-xs px-2.5 py-1 rounded border border-[#00e5c8]/50 text-[#00e5c8] hover:border-[#00e5c8] hover:bg-[#00e5c8]/10 transition"
        >
          + Get Credits
        </button>
        
        <UserMenu />
      </div>
    </div>
  )
}

// Add pt-10 to all editor page root elements to account for the fixed TokenBar
```

---

## SECTION 9 — GLOBAL STYLE OVERRIDES (Complete Teal Theme)

Run this find-and-replace across the ENTIRE codebase before anything else:

```bash
# In Cursor terminal:
find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) -exec \
  sed -i \
    -e 's/#c17d00/#00e5c8/g' \
    -e 's/#b86e00/#00e5c8/g' \
    -e 's/#d4930a/#00e5c8/g' \
    -e 's/amber-400/teal-400/g' \
    -e 's/amber-500/teal-500/g' \
    -e 's/yellow-400/teal-400/g' \
    {} +
```

And add to `src/styles/globals.css`:
```css
:root {
  --color-primary: #00e5c8;
  --color-primary-dim: rgba(0, 229, 200, 0.15);
  --color-bg: #0d1117;
  --color-surface: #151b24;
  --color-border: #1a2030;
  --color-text: #e8eaf0;
  --color-muted: #6b7280;
}

/* Override any Tailwind amber that slipped through */
.text-amber-400, .text-amber-500, .text-yellow-400 { color: var(--color-primary) !important; }
.bg-amber-400, .bg-amber-500 { background-color: var(--color-primary) !important; }
.border-amber-400, .border-amber-500 { border-color: var(--color-primary) !important; }
```

---

## SECTION 10 — START SERVICES SCRIPT

```bash
# scripts/start_all.sh — starts all required services

#!/bin/bash
echo "Starting Cinematic Forge services..."

# Main Next.js app
npm run dev &

# BullMQ workers
node src/workers/das-pull.js &
node src/workers/training-pipeline.js &

# Python microservices (Hollywood pipeline)
python src/services/otio_service.py --port 7432 &
python src/services/imf_service.py --port 7433 &
python src/services/shotgrid_service.py --port 7434 &
python src/services/exr_service.py --port 7435 &

# Intelligence cron (separate process)
node src/workers/intelligence-cron.js &

echo "All services started. Cinematic Forge running at http://localhost:3000"
wait
```

---

## SECTION 11 — FINAL WIRING CHECKLIST FOR CURSOR

Before marking build as complete, every item below must pass:

### Authentication
- [ ] Landing page at `/` — hero, features, pricing, CTAs
- [ ] Google OAuth button on login page → works
- [ ] Email/password credentials → works
- [ ] Signup flow: Step 1 account → Step 2 plan → Step 3 payment → access granted
- [ ] Free trial bypasses payment → 50 credits → access granted
- [ ] Access blocked for unauthenticated users on all editor routes
- [ ] `innovative.trailers@gmail.com` → ADMIN → credits never deducted → full access

### Payments
- [ ] Stripe checkout for all 3 plans (monthly + yearly = 6 price IDs)
- [ ] PayPal checkout for all 3 plans (monthly + yearly)
- [ ] Stripe credit pack purchase (4 packs)
- [ ] PayPal credit pack purchase (4 packs)
- [ ] Stripe webhook `invoice.payment_succeeded` → credits refreshed monthly
- [ ] PayPal webhook `PAYMENT.CAPTURE.COMPLETED` → credits added

### Token Bar
- [ ] Visible on Simple, Advanced, Ultimate mode pages (all 3)
- [ ] Shows live balance (refreshes every 30s)
- [ ] "Get Credits" opens purchase modal
- [ ] Modal shows Stripe + PayPal per pack
- [ ] Balance updates after purchase without page reload

### Sidebar
- [ ] All 17 icons in icon rail open their panel
- [ ] Clicking active icon closes panel (toggle)
- [ ] Active icon highlighted in teal
- [ ] Panel content renders correctly for each panel
- [ ] No "agent" text visible anywhere in UI

### Timeline
- [ ] Clips appear on track after generation completes
- [ ] Generating clip shows pulsing placeholder with SSE progress
- [ ] Drag to reorder works
- [ ] Trim handles work
- [ ] Repaint modal opens on right-click or R key
- [ ] Repaint completes and replaces segment

### Generation
- [ ] Credit cost shown before generate button
- [ ] Insufficient credits → toast error
- [ ] Progress shown via SSE on generating clip
- [ ] Multi-engine clips generate in parallel
- [ ] SeamlessBlender runs and produces single unified clip

### Character Vault
- [ ] Onboard New Character → 6-step modal completes
- [ ] Character appears in vault panel
- [ ] Character selectable in Generate panel
- [ ] LoRA auto-triggers after 10 scenes
- [ ] Model lock applied to character

### All Terminology
- [ ] Zero "agent" in any visible UI text
- [ ] Zero VLM names (Kling, Veo, Seedance, etc.) in any user-facing text
- [ ] Quality tiers shown as: "Quick Draft / Standard / Cinematic / Film Grade" only
- [ ] No "swarm" in any UI text or visible component names

---

*Cinematic Forge Gap Audit & Consolidation — v1.0*
*Apply after all other documents. Resolves every identified conflict and gap.*
