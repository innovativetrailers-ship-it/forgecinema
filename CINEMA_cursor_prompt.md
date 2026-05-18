# CINÉMA — Complete Cursor Build Prompt
### The World's Most Advanced AI Film & Video Production Platform

---

## MASTER BRIEF

Build **CINÉMA** — a full-stack, browser-based AI video production platform that simultaneously serves as a CapCut competitor, an Adobe Premiere replacement, and a film-grade AI studio. It must be the most technically advanced application of its kind in existence.

The platform has three distinct interface modes sharing one backend:
- **Simple Mode** — Consumer-grade text/image/audio-to-video with model selection
- **Advanced Mode** — Multi-track timeline editor with AI-assisted editing tools
- **Ultimate Mode** — Full film production suite with colour science, VFX compositor, CGI insertion, AI Director, and Dolby Atmos prep

Every feature described in this document must be implemented. Do not stub or simplify any system. Build each one completely and correctly.

---

## TECH STACK (NON-NEGOTIABLE — DO NOT DEVIATE)

### Core Framework
- **Next.js 15** with App Router and TypeScript (strict mode)
- **Tailwind CSS v4**
- **Shadcn/ui** component library
- **Zustand** for client state management
- **React Query (TanStack Query v5)** for server state

### Backend & Database
- **PostgreSQL** via **Prisma ORM** (all DB access through Prisma only)
- **Redis** via **ioredis** (queues, sessions, pub/sub, rate limiting)
- **BullMQ** for job queues (render, training, export, das-pull)

### Authentication & Payments
- **NextAuth.js v5** (Google OAuth + email/password with bcrypt)
- **Stripe** for credit purchases and subscriptions

### AI & Model APIs
- **@fal-ai/client** — unified processing gateway
- **@anthropic-ai/sdk** — Council fallback and orchestration reasoning
- **@google-cloud/vertexai** — Veo 3 integration
- Kling, Seedance, Luma, Runway, Pika, Minimax, HunyuanVideo via REST

### Media Processing
- **fluent-ffmpeg** + **@ffmpeg/ffmpeg** (wasm for browser preview)
- **@remotion/bundler** + **@remotion/renderer** for programmatic video
- **sharp** for image processing
- **music-metadata** + custom FFT for beat detection
- **@aws-sdk/client-s3** (Cloudflare R2, S3-compatible)

### Real-time & Streaming
- **Server-Sent Events** (SSE) for job progress
- **socket.io** for collaborative editing (Ultimate mode)

### Storage
- **Cloudflare R2** for CDN-served media (thumbnails, proxies, exports)
- **Local DAS** (Direct Attached Storage) for raw generated files — accessed via local Node.js pull worker

### Testing
- **Jest** + **@testing-library/react** for unit and component tests
- **Playwright** for E2E

---

## INSTALL ALL DEPENDENCIES

```bash
npx create-next-app@latest cinema --typescript --tailwind --app --src-dir
cd cinema

# Core
npm install zustand @tanstack/react-query @tanstack/react-query-devtools

# Database & Auth
npm install prisma @prisma/client next-auth@beta bcryptjs
npm install -D @types/bcryptjs

# Redis & Queues
npm install ioredis bullmq

# Payments
npm install stripe @stripe/stripe-js

# AI APIs
npm install @fal-ai/client @anthropic-ai/sdk @google-cloud/vertexai

# Media Processing
npm install fluent-ffmpeg @ffmpeg/ffmpeg @ffmpeg/core sharp music-metadata
npm install @remotion/bundler @remotion/renderer remotion
npm install -D @types/fluent-ffmpeg

# Storage
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Real-time
npm install socket.io socket.io-client

# Utilities
npm install zod nanoid date-fns axios form-data multer
npm install -D @types/multer

# UI & Editor
npm install @use-gesture/react framer-motion
npm install lucide-react class-variance-authority clsx tailwind-merge

# Testing
npm install -D jest @testing-library/react @testing-library/jest-dom playwright
```

---

## ENVIRONMENT VARIABLES

Create `.env.local` with ALL of the following. The app will not start without every variable present:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cinema"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# fal.ai (unified processing gateway)
FAL_KEY=""

# Anthropic (Council fallback)
ANTHROPIC_API_KEY=""

# Video Model APIs
KLING_API_KEY=""
KLING_API_SECRET=""
SEEDANCE_API_KEY=""
LUMA_API_KEY=""
RUNWAY_API_KEY=""
PIKA_API_KEY=""
MINIMAX_API_KEY=""
HUNYUAN_API_KEY=""

# Google Vertex AI (Veo 3)
GOOGLE_PROJECT_ID=""
GOOGLE_LOCATION="us-central1"
GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"

# Audio APIs
SUNO_SESSION_ID=""
SUNO_COOKIE=""
ELEVENLABS_API_KEY=""

# Location APIs
MAPILLARY_ACCESS_TOKEN=""
CESIUM_ION_ACCESS_TOKEN=""

# Storage — Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="cinema-media"
R2_PUBLIC_URL="https://your-r2-domain.com"

# DAS (Direct Attached Storage) — Local machine paths
DAS_BASE_PATH="/mnt/das/cinema"
DAS_TRAINING_PATH="/mnt/das/cinema/training"

# Content Moderation
NSFW_CHECK_ENABLED="true"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## FULL PRISMA SCHEMA

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  FREE
  PRO
  STUDIO
  ADMIN
}

enum JobType {
  GENERATE
  REPAINT
  RELIGHT
  UPSCALE
  EXPORT
  LORA_TRAIN
  LIPSYNC
  AUTO_SOCIAL
  TRANSCRIBE
  CGI_INSERT
}

enum JobStatus {
  QUEUED
  PROCESSING
  COMPLETE
  FAILED
  CANCELLED
}

enum LocationSource {
  MAPILLARY
  CESIUM
  OSM_FALLBACK
  USER_UPLOAD
}

enum LoraStatus {
  PENDING
  TRAINING
  READY
  FAILED
}

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  avatarUrl       String?
  passwordHash    String?
  role            UserRole  @default(FREE)
  creditBalance   Int       @default(50)
  totalGenerated  Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  projects        Project[]
  creditTxns      CreditTransaction[]
  renderJobs      RenderJob[]
  trainingData    TrainingData[]
  rlhfLogs        RLHFLog[]
  accounts        Account[]
  sessions        Session[]

  @@index([email])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Project {
  id              String    @id @default(cuid())
  userId          String
  title           String    @default("Untitled Project")
  description     String?
  thumbnailUrl    String?
  timelineJson    Json?
  durationSeconds Float     @default(0)
  fps             Int       @default(24)
  resolution      String    @default("1920x1080")
  status          String    @default("draft")
  isPublic        Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id])
  renderJobs      RenderJob[]
  vaultChars      VaultCharacter[]
  vaultLocations  VaultLocation[]

  @@index([userId])
}

model VaultCharacter {
  id              String      @id @default(cuid())
  projectId       String
  name            String
  referenceUrls   String[]
  faceEmbedding   Json?
  loraModelId     String?
  loraStatus      LoraStatus  @default(PENDING)
  modelFamily     String?
  voiceId         String?
  voiceProvider   String?
  motionRefUrl    String?
  renderCount     Int         @default(0)
  styleJson       Json?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  project         Project     @relation(fields: [projectId], references: [id])

  @@index([projectId])
}

model VaultLocation {
  id              String          @id @default(cuid())
  projectId       String
  name            String
  source          LocationSource
  lat             Float?
  lng             Float?
  hdriUrl         String?
  depthMapUrl     String?
  referenceUrls   String[]
  metaJson        Json?
  generativePrompt String?
  createdAt       DateTime        @default(now())

  project         Project         @relation(fields: [projectId], references: [id])
}

model RenderJob {
  id              String      @id @default(cuid())
  userId          String
  projectId       String?
  type            JobType
  status          JobStatus   @default(QUEUED)
  priority        Int         @default(1)
  modelUsed       String?
  creditsCharged  Int         @default(0)
  inputPayload    Json
  outputUrl       String?
  outputUrls      String[]
  proxyUrl        String?
  errorMessage    String?
  progressPct     Int         @default(0)
  processingMs    Int?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  completedAt     DateTime?

  user            User        @relation(fields: [userId], references: [id])
  project         Project?    @relation(fields: [projectId], references: [id])

  @@index([userId, status])
  @@index([projectId])
}

model CreditTransaction {
  id          String    @id @default(cuid())
  userId      String
  amount      Int
  type        String
  description String
  jobId       String?
  stripeId    String?
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id])

  @@index([userId])
}

model TrainingData {
  id                  String    @id @default(cuid())
  userId              String
  type                String
  originalUrl         String?
  instruction         String?
  regeneratedUrl      String?
  promptVariants      Json?
  selectedVariantIdx  Int?
  metadata            Json?
  isProcessed         Boolean   @default(false)
  createdAt           DateTime  @default(now())

  user                User      @relation(fields: [userId], references: [id])

  @@index([isProcessed])
}

model RLHFLog {
  id              String    @id @default(cuid())
  userId          String
  sessionId       String
  promptText      String
  modelOptions    Json
  selectedModel   String
  selectedIdx     Int
  context         Json?
  createdAt       DateTime  @default(now())

  user            User      @relation(fields: [userId], references: [id])
}

model ApiUsageLog {
  id          String    @id @default(cuid())
  provider    String
  model       String
  userId      String?
  jobId       String?
  costCents   Float
  latencyMs   Int
  success     Boolean
  createdAt   DateTime  @default(now())

  @@index([provider, createdAt])
}
```

Run: `npx prisma generate && npx prisma db push`

---

## COMPLETE FOLDER & FILE STRUCTURE

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (editor)/
│   │   ├── layout.tsx              # Shared editor shell with TopNav + ModeSwitcher
│   │   ├── simple/page.tsx
│   │   ├── advanced/page.tsx
│   │   └── ultimate/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── credits/
│   │   │   ├── balance/route.ts
│   │   │   └── purchase/route.ts
│   │   ├── jobs/
│   │   │   ├── create/route.ts
│   │   │   ├── [jobId]/status/route.ts
│   │   │   └── [jobId]/stream/route.ts     # SSE endpoint
│   │   ├── vault/
│   │   │   ├── character/create/route.ts
│   │   │   ├── character/list/route.ts
│   │   │   ├── character/[id]/route.ts
│   │   │   └── location/
│   │   │       ├── search/route.ts
│   │   │       └── cesium-path/route.ts
│   │   ├── timeline/
│   │   │   ├── render/route.ts
│   │   │   ├── proxy/route.ts
│   │   │   └── export/route.ts
│   │   ├── audio/
│   │   │   ├── music/route.ts
│   │   │   ├── speech/route.ts
│   │   │   ├── foley/route.ts
│   │   │   └── beats/route.ts
│   │   ├── auto-social/route.ts
│   │   ├── location/
│   │   │   ├── mapillary/route.ts
│   │   │   ├── cesium/route.ts
│   │   │   └── osm/route.ts
│   │   ├── moderation/check/route.ts
│   │   └── webhooks/
│   │       ├── stripe/route.ts
│   │       └── fal/route.ts
│   ├── layout.tsx
│   └── page.tsx                    # Landing / redirect to /simple
│
├── components/
│   ├── editor/
│   │   ├── Timeline.tsx            # Full multi-track timeline
│   │   ├── TrackRow.tsx
│   │   ├── Clip.tsx                # Individual clip with context menu
│   │   ├── Playhead.tsx
│   │   ├── TimeRuler.tsx
│   │   ├── Preview.tsx             # Video preview with playback controls
│   │   ├── PropertiesPanel.tsx     # Right panel — clip properties + repaint
│   │   ├── GeneratePanel.tsx       # Left panel — prompt + model selector
│   │   ├── VaultPanel.tsx          # Character vault display
│   │   ├── LocationPanel.tsx       # Location engine UI
│   │   ├── TransitionPicker.tsx    # CapCut-style transition library
│   │   └── RepaintModal.tsx        # Repaint workflow modal
│   ├── studio/                     # Ultimate mode components
│   │   ├── ColorGrading.tsx        # ASC CDL, LUT, film emulation
│   │   ├── AudioMixer.tsx          # Multi-track faders, compressor, Atmos
│   │   ├── VFXCompositor.tsx       # Layer compositing, blend modes
│   │   ├── CGIInsertion.tsx        # Text→3D→composite workflow
│   │   ├── AIDirector.tsx          # Autonomous film orchestration
│   │   ├── ContinuityChecker.tsx   # Cross-scene error detection
│   │   ├── StoryboardAI.tsx        # Script→storyboard generator
│   │   └── SpatialExport.tsx       # Vision Pro / Quest output
│   ├── simple/
│   │   ├── PromptInput.tsx
│   │   ├── ModelSelector.tsx       # Quality tier → model routing
│   │   ├── DurationPicker.tsx
│   │   ├── GenerationProgress.tsx  # SSE-connected progress display
│   │   ├── GenerationGallery.tsx
│   │   └── AutoSocialDrop.tsx      # 30-asset drag-and-drop bin
│   ├── vault/
│   │   ├── CharacterCard.tsx
│   │   ├── CharacterCreator.tsx    # Multi-image upload + extraction
│   │   ├── VoiceVault.tsx          # ElevenLabs voice clone manager
│   │   └── VaultManager.tsx
│   └── ui/
│       ├── TopNav.tsx
│       ├── ModeSwitcher.tsx
│       ├── CreditDisplay.tsx
│       ├── JobProgressBadge.tsx
│       └── SSEProvider.tsx         # Global SSE connection context
│
├── lib/
│   ├── models/
│   │   ├── types.ts                # Shared input/output interfaces
│   │   ├── router.ts               # Master routing decision tree
│   │   ├── kling.ts
│   │   ├── veo3.ts
│   │   ├── seedance.ts
│   │   ├── luma.ts
│   │   ├── runway.ts
│   │   ├── pika.ts
│   │   ├── minimax.ts
│   │   ├── hunyuan.ts
│   │   ├── animatediff.ts
│   │   └── svd.ts
│   ├── fal/
│   │   ├── client.ts               # Singleton fal.ai client
│   │   ├── lighting.ts             # IC-Light, normal maps, HDRI match
│   │   ├── character.ts            # Face ID, IP-Adapter, CodeFormer
│   │   ├── enhancement.ts          # AuraSR, REMBG, Depth Anything
│   │   ├── sync.ts                 # SadTalker, Whisper
│   │   ├── training.ts             # LoRA training trigger + polling
│   │   └── proxy.ts                # Flux-Schnell fast preview drafts
│   ├── audio/
│   │   ├── suno.ts
│   │   ├── elevenlabs.ts
│   │   ├── audiocraft.ts
│   │   └── beats.ts                # FFT beat detection
│   ├── timeline/
│   │   ├── schema.ts               # TimelineRecipe TypeScript types
│   │   ├── renderer.ts             # FFmpeg render from JSON recipe
│   │   ├── proxy.ts                # Fast proxy frame generation
│   │   ├── export.ts               # Final export pipeline
│   │   └── harmonise.ts            # Cross-model texture normalisation
│   ├── vault/
│   │   ├── character.ts            # Character CRUD + embedding
│   │   ├── location.ts             # Location CRUD
│   │   ├── lora-trigger.ts         # 10-scene threshold trigger
│   │   └── model-lock.ts           # Model family enforcement
│   ├── location/
│   │   ├── mapillary.ts
│   │   ├── cesium.ts
│   │   ├── osm.ts
│   │   └── spline.ts               # Catmull-Rom interpolation
│   ├── queue/
│   │   ├── index.ts                # Queue definitions + exports
│   │   ├── workers/
│   │   │   ├── render.worker.ts
│   │   │   ├── training.worker.ts
│   │   │   └── export.worker.ts
│   │   └── events.ts               # SSE event broadcasting
│   ├── storage/
│   │   ├── r2.ts                   # Cloudflare R2 client + signed URLs
│   │   └── das.ts                  # DAS path utilities
│   ├── telemetry/
│   │   ├── rlhf.ts                 # Preference signal logging
│   │   └── delta.ts                # Repaint delta capture
│   ├── moderation/
│   │   └── nsfw.ts                 # NSFW classification pipeline
│   ├── credits.ts                  # Credit check, deduct, transaction
│   ├── auth.ts                     # NextAuth options
│   ├── db.ts                       # Prisma client singleton
│   └── redis.ts                    # Redis client singleton
│
├── workers/
│   └── das-pull.ts                 # Standalone DAS ingestion process
│
├── store/
│   ├── editor.ts                   # Zustand — timeline state
│   ├── vault.ts                    # Zustand — vault state
│   └── jobs.ts                     # Zustand — active job tracking
│
├── hooks/
│   ├── useSSE.ts                   # SSE connection hook
│   ├── useTimeline.ts              # Timeline manipulation hooks
│   ├── useVault.ts
│   └── useCredits.ts
│
└── middleware.ts                   # Auth guard + rate limiter
```

---

## IMPLEMENTATION — EVERY SYSTEM IN DETAIL

### 1. DATABASE + REDIS SINGLETONS

`src/lib/db.ts` — Prisma singleton with connection pooling:
```typescript
import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

`src/lib/redis.ts` — ioredis singleton:
```typescript
import Redis from 'ioredis'
const globalForRedis = globalThis as unknown as { redis: Redis }
export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  lazyConnect: true
})
if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
```

---

### 2. AUTHENTICATION (NextAuth v5)

`src/lib/auth.ts` — Configure NextAuth with:
- Google OAuth provider
- Credentials provider (email + bcrypt password hash, min 8 chars)
- JWT strategy — token includes `{ id, email, role, creditBalance }`
- Session callback that re-fetches `creditBalance` from DB on every request
- Custom sign-in page at `/login`

`src/app/api/auth/[...nextauth]/route.ts` — Export handlers from `src/lib/auth.ts`

`src/middleware.ts` — Protect all `/api/*` routes except `/api/auth/*`. Attach decoded session to `request.headers`. Implement sliding window rate limiting using Redis:
- FREE: 20 requests/min to `/api/jobs/create`
- PRO: 100 requests/min
- STUDIO: 500 requests/min
- Return 429 with `{ error: 'rate_limited', retryAfter: N }` when exceeded

---

### 3. TOKEN ECONOMY

`src/lib/credits.ts` — Implement the full credit system:

```typescript
export const OPERATION_COSTS: Record<string, number> = {
  // Video generation (per 5 seconds)
  generate_hunyuan: 3,
  generate_wan: 2,
  generate_animatediff: 1,
  generate_luma: 8,
  generate_pika: 8,
  generate_minimax: 10,
  generate_cog: 6,
  generate_kling_standard: 18,
  generate_kling_pro: 25,
  generate_seedance: 20,
  generate_runway: 22,
  generate_veo3: 35,
  generate_sora: 40,
  // Processing
  relight_iclight: 2,
  upscale_4x: 3,
  face_restore: 2,
  lipsync: 5,
  transcribe: 1,
  remove_bg: 1,
  depth_map: 1,
  proxy_draft: 0,          // Always free
  // Character
  lora_training: 60,
  ip_adapter_inject: 1,
  // Audio
  music_generate_30s: 5,
  music_generate_120s: 15,
  speech_generate: 3,
  foley_generate: 4,
  // 3D / CGI
  cgi_generate_3d: 20,
  cgi_composite: 5,
  // Export
  export_1080p: 8,
  export_4k: 20,
  export_dcp: 40,
  // Extras
  auto_social: 10,
  ai_director: 50,
  storyboard_gen: 15,
  continuity_check: 5,
}

export async function checkAndDeductCredits(
  userId: string,
  operation: keyof typeof OPERATION_COSTS,
  multiplier: number = 1
): Promise<void>
// Must use Prisma transaction to atomically read and deduct
// Throws CreditError with message if balance insufficient

export async function refundCredits(userId: string, amount: number, reason: string): Promise<void>
export async function addCredits(userId: string, amount: number, stripeId?: string): Promise<void>
```

`src/app/api/credits/purchase/route.ts` — Stripe checkout session:
- Credit packs: 100 credits = $5, 500 credits = $20, 2000 credits = $65, 10000 credits = $250
- On webhook success: call `addCredits()` and record `CreditTransaction`

---

### 4. JOB QUEUE SYSTEM (BullMQ)

`src/lib/queue/index.ts` — Define three queues:

```typescript
import { Queue, Worker, QueueEvents } from 'bullmq'
import { redis } from '../redis'

const connection = { connection: redis }

export const renderQueue = new Queue('render', {
  ...connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 100 },
  }
})

export const trainingQueue = new Queue('training', connection)
export const exportQueue = new Queue('export', connection)
export const renderQueueEvents = new QueueEvents('render', connection)
```

Priority mapping: STUDIO users → priority 10, PRO → 5, FREE → 1

`src/lib/queue/workers/render.worker.ts` — The render worker must:
1. Read job data: `{ userId, projectId, type, modelId, payload }`
2. Update RenderJob status to PROCESSING in DB
3. Call `checkAndDeductCredits()`
4. Route to correct model via `src/lib/models/router.ts`
5. Poll the model API until complete (with timeout of 10 minutes)
6. On completion: save output URL, update status COMPLETE, broadcast SSE event
7. If video type: run post-processing pipeline (harmonise → restore face → upscale if export)
8. Log to `ApiUsageLog` and `TrainingData`
9. Call `loraAutoTrigger()` if job involved a vaulted character
10. On failure: update status FAILED, refund credits, broadcast error SSE

`src/lib/queue/events.ts` — SSE broadcaster:
```typescript
// Store SSE response objects in a Map<jobId, Response>
// Broadcast { status, progress, message, outputUrl } to the correct client
// Use Redis pub/sub so broadcasting works across multiple Node processes
```

`src/app/api/jobs/[jobId]/stream/route.ts` — SSE endpoint:
```typescript
export async function GET(req, { params }) {
  const stream = new ReadableStream({
    start(controller) {
      // Subscribe to Redis channel `job:${params.jobId}`
      // Push SSE data: `data: ${JSON.stringify(event)}\n\n`
      // Close on job completion or client disconnect
    }
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
```

---

### 5. MODEL ROUTING DECISION TREE

`src/lib/models/types.ts`:
```typescript
export interface GenerateVideoInput {
  prompt: string
  negativePrompt?: string
  duration: number              // seconds
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '21:9'
  startFrameUrl?: string        // for V2V / repaint
  endFrameUrl?: string          // for frame-anchored repaint
  characterRefs?: string[]      // IP-Adapter reference images
  loraId?: string               // fal.ai LoRA model ID
  cameraMotion?: string         // "pan left", "zoom in", etc.
  motionStrength?: number       // 0-1
  seed?: number
}

export interface GenerateVideoOutput {
  jobId: string
  videoUrl?: string
  thumbnailUrl?: string
  status: 'pending' | 'processing' | 'complete' | 'failed'
  pollUrl?: string
  error?: string
}
```

`src/lib/models/router.ts` — Complete routing logic:

```typescript
export type QualityTier = 'draft' | 'standard' | 'premium' | 'cinematic' | 'film'
export type SceneType = 'action' | 'dialogue' | 'environment' | 'aerial' | 'cgi_heavy' | 'general'

export function routeToModel(
  tier: QualityTier,
  sceneType: SceneType,
  hasCharacter: boolean,
  userRole: UserRole,
  durationSeconds: number
): string {
  // FREE users: capped at standard
  if (userRole === 'FREE' && (tier === 'premium' || tier === 'cinematic' || tier === 'film')) {
    tier = 'standard'
  }

  if (tier === 'draft') return 'wan'
  if (tier === 'standard') {
    if (sceneType === 'dialogue') return 'seedance'
    if (sceneType === 'aerial' || sceneType === 'environment') return 'luma'
    if (durationSeconds > 60) return 'minimax'
    return 'hunyuan'
  }
  if (tier === 'premium') {
    if (hasCharacter) return 'kling_pro'
    if (sceneType === 'action') return 'kling_standard'
    return 'runway'
  }
  if (tier === 'cinematic') {
    if (hasCharacter) return 'seedance'
    return 'veo3'
  }
  if (tier === 'film') return 'veo3' // with sora fallback
  return 'hunyuan'
}

// Cost multiplier for duration (base cost is per 5 seconds)
export function getDurationMultiplier(seconds: number): number {
  return Math.ceil(seconds / 5)
}
```

---

### 6. VIDEO MODEL INTEGRATIONS

Implement each model in `src/lib/models/`. Every client exports:
- `generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput>`
- `pollStatus(externalJobId: string): Promise<GenerateVideoOutput>`

**Kling** (`src/lib/models/kling.ts`):
- Base URL: `https://api.klingai.com/v1`
- Auth: JWT — sign `{ iss: KLING_API_KEY, exp: now+1800 }` with `KLING_API_SECRET` using HS256
- Endpoint: `POST /videos/text2video` or `POST /videos/image2video`
- Poll: `GET /videos/text2video/{task_id}`

**Veo 3** (`src/lib/models/veo3.ts`):
- Use `@google-cloud/vertexai` with `ImageGenerationModel`
- Project: `GOOGLE_PROJECT_ID`, Location: `GOOGLE_LOCATION`
- Model: `veo-3.0-generate-preview`
- Generate via `generateContent`, poll via operation name

**Seedance** (`src/lib/models/seedance.ts`):
- Base URL: `https://api.seedance.ai/v1` (verify against current docs)
- Auth: Bearer `SEEDANCE_API_KEY`
- Endpoint: `POST /video/generate`

**Luma Dream Machine** (`src/lib/models/luma.ts`):
- Base URL: `https://api.lumalabs.ai/dream-machine/v1`
- Auth: Bearer `LUMA_API_KEY`
- Endpoint: `POST /generations`
- Poll: `GET /generations/{id}`

**Runway Gen-4** (`src/lib/models/runway.ts`):
- Base URL: `https://api.runwayml.com/v1`
- Auth: Bearer `RUNWAY_API_KEY`
- Endpoint: `POST /image_to_video` or `POST /text_to_video`

**Pika** (`src/lib/models/pika.ts`):
- Base URL: `https://api.pika.art/v2`
- Auth: Bearer `PIKA_API_KEY`

**Minimax** (`src/lib/models/minimax.ts`):
- Base URL: `https://api.minimax.chat/v1`
- For long-form (up to 6 minutes) generation

**HunyuanVideo + Wan** — Both via fal.ai:
- `fal-ai/hunyuan-video`, `fal-ai/wan-i2v`

---

### 7. FAL.AI PROCESSING LAYER

`src/lib/fal/client.ts`:
```typescript
import { fal } from '@fal-ai/client'
fal.config({ credentials: process.env.FAL_KEY })
export { fal }
```

`src/lib/fal/lighting.ts`:
```typescript
export async function relightScene(params: {
  imageUrl: string
  prompt: string             // e.g. "neon cyberpunk lighting from left"
  hdriUrl?: string           // HDRI environment map URL
  backgroundPrompt?: string
}): Promise<{ outputUrl: string }>
// Use: fal.run('fal-ai/ic-light', { image_url, prompt, ... })

export async function extractNormalMap(imageUrl: string): Promise<{ normalMapUrl: string }>
// Use: fal.run('fal-ai/image-preprocessors/normal-bae', { image_url })

export async function matchLocationLighting(
  locationPlateUrl: string,
  targetImageUrl: string
): Promise<{ relitUrl: string }>
// Extract dominant light direction and colour temperature from plate
// Apply to target via IC-Light with matched parameters
```

`src/lib/fal/character.ts`:
```typescript
export async function extractFaceEmbedding(imageUrl: string): Promise<{ embedding: number[] }>
// Use: fal.run('fal-ai/face-id', { image_url })

export async function restoreFace(imageUrl: string): Promise<{ restoredUrl: string }>
// Use: fal.run('fal-ai/codeformer', { image_url, fidelity: 0.7 })

export async function buildIPAdapterPayload(
  referenceUrls: string[],
  loraId?: string
): Promise<object>
// Returns the IP-Adapter injection object to append to generation payloads
```

`src/lib/fal/enhancement.ts`:
```typescript
export async function upscale4x(imageUrl: string): Promise<{ upscaledUrl: string }>
// Use: fal.run('fal-ai/aura-sr', { image_url, upscaling_factor: 4 })

export async function removeBackground(imageUrl: string): Promise<{ maskedUrl: string }>
// Use: fal.run('fal-ai/imageutils/rembg', { image_url })

export async function extractDepthMap(imageUrl: string): Promise<{ depthUrl: string }>
// Use: fal.run('fal-ai/depth-anything-v2', { image_url })

export async function generateProxyFrame(prompt: string): Promise<{ imageUrl: string }>
// Use: fal.run('fal-ai/flux/schnell', { prompt, image_size: 'landscape_16_9', num_inference_steps: 4 })
// This must return in under 3 seconds — used for live timeline preview
```

`src/lib/fal/sync.ts`:
```typescript
export async function lipSync(params: {
  faceImageUrl: string
  audioUrl: string
  expressionScale?: number
}): Promise<{ videoUrl: string }>
// Use: fal.run('fal-ai/sadtalker', { source_image_url, driven_audio_url, expression_scale })

export async function transcribeAudio(audioUrl: string): Promise<{
  text: string
  segments: Array<{ start: number, end: number, text: string }>
}>
// Use: fal.run('fal-ai/whisper', { audio_url, task: 'transcribe' })
```

`src/lib/fal/training.ts`:
```typescript
export async function triggerLoraTraining(params: {
  characterId: string
  imageUrls: string[]       // 10-20 reference images
  characterName: string
}): Promise<{ loraModelId: string }>
// Use: fal.subscribe('fal-ai/flux-lora-fast-training', {
//   input: { images_data_url: zipped_images, trigger_word: characterName },
//   onQueueUpdate: updateLoraStatus
// })
// On completion: update VaultCharacter.loraModelId and .loraStatus = 'READY'
```

---

### 8. TIMELINE ENGINE

`src/lib/timeline/schema.ts` — Complete TypeScript schema for the JSON recipe:

```typescript
export interface TimelineRecipe {
  id: string
  projectId: string
  fps: 24 | 30 | 60
  resolution: { width: number, height: number }
  durationSeconds: number
  colorSpace: 'rec709' | 'dci-p3' | 'rec2020'
  tracks: Track[]
  globalEffects?: GlobalEffect[]
  audioMixSettings?: AudioMixSettings
  colourGradeSettings?: ColourGradeSettings
  exportSettings?: ExportSettings
}

export interface Track {
  id: string
  type: 'video' | 'audio' | 'vfx' | 'caption' | 'cgi'
  label: string
  muted: boolean
  locked: boolean
  solo: boolean
  volume?: number        // audio tracks only
  clips: Clip[]
}

export interface Clip {
  id: string
  trackId: string
  startTime: number      // seconds from timeline start
  endTime: number
  sourceUrl: string      // R2 URL of generated video/audio
  proxyUrl?: string      // low-res proxy for scrubbing
  modelUsed?: string
  prompt?: string
  characterId?: string   // vault reference
  locationId?: string
  transition?: Transition
  effects?: ClipEffect[]
  transform?: ClipTransform
  colourGrade?: ClipColourGrade
  audioSettings?: ClipAudio
  metadata?: Record<string, unknown>
}

export interface Transition {
  type: 'cut' | 'dissolve' | 'fade' | 'wipe' | 'zoom' | 'glitch' | 'film_burn'
  duration: number        // seconds
  direction?: string
}

export interface ClipEffect {
  type: 'rain' | 'snow' | 'fog' | 'film_grain' | 'halation' | 'vignette' |
        'lens_flare' | 'bloom' | 'chromatic_aberration' | 'motion_blur' |
        'glow' | 'dust_particles' | 'lightning' | 'fire' | 'smoke'
  intensity: number       // 0-1
  params?: Record<string, number>
}

export interface ClipTransform {
  x: number, y: number, scale: number, rotation: number, opacity: number
  kenBurns?: { startRect: Rect, endRect: Rect }   // for static images
}

export interface ColourGradeSettings {
  lut?: { url: string, intensity: number }
  filmEmulation?: 'kodak_5219' | 'fuji_3510' | 'kodak_2383' | 'bw_contrast' | 'none'
  asc_cdl: {
    lift: [number, number, number]     // RGB
    gamma: [number, number, number]
    gain: [number, number, number]
    saturation: number
  }
  shadows: number, midtones: number, highlights: number
  temperature: number, tint: number
}

export interface AudioMixSettings {
  masterVolume: number
  masterCompressor: boolean
  spatialAudio: boolean          // Dolby Atmos flag
  tracks: Array<{
    trackId: string
    volume: number
    pan: number
    eq: { low: number, mid: number, high: number }
  }>
}

export interface ExportSettings {
  format: 'mp4_h264' | 'mp4_h265' | 'prores_422' | 'prores_4444' | 'dcp'
  resolution: { width: number, height: number }
  bitrate: number                // kbps
  audioCodec: 'aac' | 'pcm' | 'ac3'
  metadata: Record<string, string>
}
```

`src/lib/timeline/renderer.ts` — FFmpeg renderer:
- Accept a `TimelineRecipe` and an output path
- Build FFmpeg filter graph from tracks: overlay video, mix audio, apply LUT, apply effects
- Support transition rendering between clips using `xfade` filter
- Export to specified format and resolution
- Log progress via callback (percent complete)

`src/lib/timeline/harmonise.ts` — Cross-model texture normaliser:
- Accept array of clip URLs from different model families
- Apply a lightweight style normalisation pass using fal.ai's img2img
- Normalise: grain level, colour temperature, compression artefacts
- Return normalised clip URLs

`src/lib/timeline/proxy.ts` — Fast proxy system:
- For each clip, generate 1fps proxy frames via `generateProxyFrame()` from fal.ai
- Store frame URLs indexed by timestamp
- Return a proxy manifest the timeline scrubber can use for instant preview

---

### 9. CHARACTER VAULT SYSTEM

`src/lib/vault/lora-trigger.ts`:
```typescript
export async function checkLoraAutoTrigger(
  characterId: string,
  projectId: string
): Promise<void> {
  // Count completed RenderJobs where inputPayload.characterId === characterId
  // If count >= 10 AND character.loraStatus === 'PENDING':
  //   1. Fetch all reference images from VaultCharacter.referenceUrls
  //   2. Also collect generated scene thumbnails for this character
  //   3. Call triggerLoraTraining() from fal/training.ts
  //   4. Update loraStatus to 'TRAINING'
  //   5. When training completes via webhook: set loraStatus to 'READY', store loraModelId
}
```

`src/lib/vault/model-lock.ts`:
```typescript
export async function getLockedModelFamily(characterId: string): Promise<string | null> {
  // Read VaultCharacter.modelFamily
  // If null: return null (no lock yet)
  // If set: return the model family string (e.g. 'kling', 'seedance', 'veo3')
}

export async function setModelLockIfNeeded(characterId: string, modelUsed: string): Promise<void> {
  // On first successful generation: set VaultCharacter.modelFamily
  // Never overwrite once set — the lock is permanent for that character
}
```

`src/app/api/vault/character/create/route.ts`:
- Accept multipart form: `name`, up to 5 image files
- Upload images to R2
- Call `extractFaceEmbedding()` on the best image
- Call `extractDepthMap()` on all images
- Create `VaultCharacter` in DB
- Return character object

---

### 10. LOCATION ENGINE

`src/lib/location/mapillary.ts`:
```typescript
export async function searchLocations(params: {
  description: string        // e.g. "narrow alleyway, brick, Tokyo"
  maxResults?: number
}): Promise<Array<{
  id: string
  lat: number, lng: number
  imageUrl: string
  description: string
  capturedAt: string
}>>
// Use Mapillary API v4: GET https://graph.mapillary.com/images
// Filter by location keywords parsed from description
// Return top results with thumbnail URLs
```

`src/lib/location/cesium.ts`:
```typescript
export async function buildAerialPath(params: {
  waypoints: Array<{ lat: number, lng: number }>
  altitudeMeters: number
  gimbalTarget?: { lat: number, lng: number }
}): Promise<{
  cameraPath: Array<{ lat: number, lng: number, alt: number, heading: number, pitch: number }>
  basePlateVideoUrl: string   // Cesium-rendered fly-through
}>
// Use Cesium Ion API for 3D terrain data
// Apply Catmull-Rom spline interpolation to waypoints (see spline.ts)
// Generate smooth camera path with proper heading/pitch calculations
// Render base plate as MP4 via Cesium Ion streaming
// Pass base plate through a V2V model (Kling/Veo3) for photorealistic rendering
```

`src/lib/location/osm.ts`:
```typescript
export async function buildGenerativeLocationPrompt(placeDescription: string): Promise<string>
// 1. Call Nominatim: GET https://nominatim.openstreetmap.org/search?q={description}&format=json
// 2. Extract: country, city, neighbourhood, type of area, notable features
// 3. Call Anthropic Claude to write a rich generative video prompt:
//    "You are a cinematographer. Write a detailed prompt for generating a video of [location]
//     incorporating: [OSM metadata]. Include: lighting, materials, atmosphere, camera angle."
// 4. Return the generated prompt string
```

`src/lib/location/spline.ts`:
```typescript
export function catmullRomSpline(
  points: Array<{ x: number, y: number, z: number }>,
  tension: number = 0.5,
  numSegments: number = 20
): Array<{ x: number, y: number, z: number }>
// Full Catmull-Rom spline interpolation — do not use a library, implement it
```

---

### 11. AUDIO PIPELINE

`src/lib/audio/suno.ts`:
```typescript
export async function generateMusic(params: {
  prompt: string            // e.g. "cinematic tension, strings, dark ambient"
  durationSeconds: number   // 30, 60, 120, 240
  instrumental?: boolean
}): Promise<{ audioUrl: string, title: string, stems?: string[] }>
// POST to Suno API with session cookie auth
// Poll until complete
// Return hosted audio URL
```

`src/lib/audio/elevenlabs.ts`:
```typescript
export async function synthesiseSpeech(params: {
  text: string
  voiceId: string           // from VaultCharacter.voiceId
  emotion?: 'neutral' | 'excited' | 'sad' | 'angry' | 'whispering'
  stability?: number        // 0-1
  similarityBoost?: number  // 0-1
}): Promise<{ audioUrl: string }>
// POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}
// Accept audio/mpeg response, upload to R2, return URL

export async function cloneVoice(params: {
  name: string
  audioSamples: string[]    // URLs of 30+ second audio samples
}): Promise<{ voiceId: string }>
// POST https://api.elevenlabs.io/v1/voices/add
// Return new voice ID to store in VaultCharacter.voiceId
```

`src/lib/audio/beats.ts`:
```typescript
export async function detectBeats(audioUrl: string): Promise<{
  beats: number[]           // array of beat timestamps in seconds
  bpm: number
  downbeats: number[]       // major beat timestamps for cut placement
}>
// Download audio, run FFT analysis using Web Audio API or node-web-audio-api
// Implement onset detection algorithm
// Return beat timestamps for auto-social cut timing
```

`src/lib/audio/audiocraft.ts`:
```typescript
export async function generateFoley(params: {
  description: string       // e.g. "footsteps on wet pavement"
  durationSeconds: number
}): Promise<{ audioUrl: string }>
// Use fal.ai's AudioCraft integration: fal-ai/stable-audio
```

---

### 12. AUTO-SOCIAL (DROP & DIRECT)

`src/app/api/auto-social/route.ts`:
- Accept up to 30 asset URLs (video and image mixed)
- Call Anthropic Claude Vision (claude-sonnet-4-20250514) to analyze ALL assets in one request
- System prompt: "You are a professional social media film editor. Analyze these visual assets and create an optimised edit list for a compelling 30-90 second social media video. Return ONLY valid JSON."
- Required Claude output schema:
```json
{
  "narrative": "string — one sentence describing the story",
  "targetDuration": 45,
  "selectedClips": [
    {
      "assetIndex": 0,
      "startTime": 0,
      "endTime": 3.5,
      "kenBurns": { "startScale": 1.0, "endScale": 1.15, "x": 0, "y": 0 },
      "transition": "dissolve",
      "emotionalTone": "energetic"
    }
  ],
  "musicPrompt": "upbeat, driving rhythm, electronic, hopeful",
  "captionSuggestion": "string",
  "hashtagSuggestions": ["#cinema", "#aifilm"]
}
```
- Generate beat-matched music via Suno using the musicPrompt
- Align selectedClips to beat timestamps
- Create TimelineRecipe JSON from the edit list
- Return recipe + proxy render URL

---

### 13. AI DIRECTOR MODE (Ultimate)

`src/lib/studio/director.ts`:
```typescript
export async function runAIDirector(params: {
  brief: string              // User's creative brief or script
  availableCharacters: VaultCharacter[]
  availableLocations: VaultLocation[]
  targetDuration: number     // seconds
  style: string              // e.g. "noir thriller", "heartwarming documentary"
}): Promise<TimelineRecipe>
// Use Claude (claude-sonnet-4-20250514) with a 8000-token system prompt covering:
// - Film grammar and shot language
// - Character continuity rules
// - Model selection rationale
// - JSON recipe schema
// Have Claude produce a complete TimelineRecipe
// Then run generate jobs for every clip in the recipe
// Return the populated recipe with actual generated clip URLs
```

---

### 14. CONTINUITY CHECKER

`src/lib/studio/continuity.ts`:
```typescript
export async function checkContinuity(recipe: TimelineRecipe): Promise<Array<{
  type: 'prop' | 'costume' | 'lighting' | 'time_jump' | 'character_mismatch'
  severity: 'warning' | 'error'
  clips: [string, string]   // IDs of the two conflicting clips
  description: string
  suggestion: string
}>>
// Extract thumbnail frames from each clip
// Send all frames to Claude Vision with continuity checking prompt
// Return structured list of identified continuity errors
```

---

### 15. CGI INSERTION PIPELINE

`src/app/api/cgi/insert/route.ts`:
- Accept: `{ videoUrl, prompt, insertionTimestamps: [start, end], depthMatchFrame }`
- Generate 3D object via `fal.run('fal-ai/triposg', { prompt })`
- Extract depth map of the insertion frame via `extractDepthMap()`
- Estimate scene lighting from frame via `matchLocationLighting()`
- Render 3D object with matched lighting and correct perspective
- Composite into video using FFmpeg with depth-aware Z-ordering
- Return composited video URL

---

### 16. COLOUR GRADING ENGINE

`src/lib/studio/colour.ts`:
```typescript
export async function applyLUT(params: {
  videoUrl: string
  lutUrl: string            // .cube file URL
  intensity: number         // 0-1
}): Promise<{ outputUrl: string }>
// Download .cube LUT, parse it, apply via FFmpeg lut3d filter

export async function applyASCCDL(params: {
  videoUrl: string
  lift: [number, number, number]
  gamma: [number, number, number]
  gain: [number, number, number]
  saturation: number
}): Promise<{ outputUrl: string }>
// Apply via FFmpeg colorgrade + colorchannelmixer filters

export const FILM_EMULATION_LUTS: Record<string, string> = {
  'kodak_5219': '/luts/kodak-5219.cube',
  'fuji_3510': '/luts/fuji-3510.cube',
  'kodak_2383': '/luts/kodak-2383.cube',
  'bw_contrast': '/luts/bw-contrast.cube',
}
```

---

### 17. DAS PULL WORKER

`src/workers/das-pull.ts` — Run as a separate Node.js process:

```typescript
import { redis } from '../lib/redis'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import path from 'path'
import https from 'https'

// Subscribe to Redis list: 'das:queue'
// Each item: { jobId, videoUrl, projectId, userId, type }
// For each item:
//   1. Determine DAS path: DAS_BASE_PATH/projectId/jobId.mp4
//   2. Create directory if needed
//   3. Stream URL → DAS file using stream.pipeline()
//   4. Upload to R2 for CDN delivery
//   5. Generate signed URL (7-day expiry)
//   6. Update RenderJob.outputUrl with R2 signed URL
//   7. Broadcast SSE event: { status: 'stored', outputUrl }
//   8. For training data: copy to DAS_TRAINING_PATH

// Error handling: if DAS write fails, fall back to R2-only storage
// Implement basic DAS health check: write test file on startup
```

---

### 18. CONTENT MODERATION

`src/lib/moderation/nsfw.ts`:
```typescript
export async function checkNSFW(imageOrVideoUrl: string): Promise<{
  safe: boolean
  score: number             // 0-1, higher = more likely unsafe
  categories: string[]
}>
// Use fal.ai NSFW detection model on extracted frames
// For video: check every 2 seconds of content
// If score > 0.7: flag as unsafe, do not deliver to user
// Add to moderation review queue
// Always run this check before any outputUrl is returned to client
```

---

## COMPLETE UI SPECIFICATION

### Simple Mode (`/simple`)

The simplest possible path from idea to video. Build this as a clean, single-column layout:

**Hero Section:**
- Large text area: "Describe your video..." (placeholder)
- Below it: a row of four quality pills — `Quick Draft` (2 credits) / `Standard` (8 credits) / `Cinematic` (25 credits) / `Film Grade` (40 credits)
- Duration selector: `5s` / `10s` / `15s` / `30s` / `60s` / `Custom`
- Aspect ratio: `16:9` / `9:16` (vertical) / `1:1` / `21:9`
- Advanced toggle (PRO+): reveals model override dropdown with all 15 models listed by tier

**Generate Button**: Large amber button. On click: POST to `/api/jobs/create`, subscribe to SSE stream, show live progress overlay on the generation card.

**Image-to-Video Tab**: Upload area + prompt + motion strength slider (0-100)

**Audio-to-Video Tab**: Upload audio file → beat detection → auto-generate visuals matching the beat. Model selector for visual style.

**Auto-Social Tab** (Drop & Direct): Full-width drop zone "Drop up to 30 photos or videos here". On drop: show grid of thumbnails. "Generate content" button → calls `/api/auto-social` → shows progress → delivers complete edit with music.

**Results Gallery**: Grid of all generated clips with: model badge, credits used, regenerate button, add-to-timeline button, download button. Clicking a clip expands it to full preview.

---

### Advanced Mode (`/advanced`)

A professional multi-track timeline editor. The layout is a fixed-height full-viewport editor shell. Build with pixel-perfect dark theme (background `#0c0c10`):

**Top Navigation Bar (42px)**: Logo left, mode switcher centre, render queue indicator + export button + user avatar right. Credit balance shown as `⬡ 1,240` always visible.

**Left Panel — Icon Bar (44px wide)**: Vertical stack of tool icons. Active tool highlighted amber. Tools: Select, Razor, Repaint, Text, Character (vault), Location, Audio, FX, Settings.

**Left Panel — Expanded Tool Panel (150px, slides out on icon click)**:
- **Generate tab**: Prompt textarea, model selector, quality pills, duration, "Generate" button. Character selector from vault (dropdown populated from VaultCharacter). Location selector from vault.
- **Vault tab**: List of saved characters with LoRA status badges. "Add character" button opens CharacterCreator modal.
- **Library tab**: Browse all project's generated clips. Drag from library to timeline.
- **Location tab**: Location search input, search results list, pinned locations.
- **Transitions tab**: Grid of all available transitions with preview on hover.

**Video Preview (200px tall)**: Dark viewport showing current frame at playhead position. Timecode overlay top-left. Generating-clip badge top-right (SSE-connected). Playback controls (⏮ ⏸ ⏭) bottom-centre. Fullscreen button. Playhead line drawn through preview aligned with timeline playhead.

**Timeline (remaining height)**:
- Time ruler with tick marks, timecode labels, draggable playhead
- Tracks in order: VIDEO 1, VIDEO 2 (overlay), VFX, CGI, MUSIC, VOICE, SFX, CAPTIONS
- Each track has: colour-coded label column (76px), mute/solo buttons, expand handle
- Clips on tracks: coloured by model family (blue=Kling, purple=Veo3, teal=Seedance, coral=budget). Show: scene name, model badge, small waveform for audio clips.
- **Selected clip**: amber 1.5px border, elevated z-index
- **Generating clip**: dashed border, pulsing opacity, "⟳ Generating..." label, SSE-connected progress
- **Drag & drop**: clips draggable to reorder. Trim handles on clip edges. Snapping to other clips and beat markers.
- Timeline zoom: pinch or scroll with modifier key. Fit-to-window button.

**Right Panel — Properties (178px)**:
- When no clip selected: project settings (fps, resolution, colour space)
- When clip selected:
  - Clip name (editable)
  - Model badge + duration
  - Prompt text (editable — triggers regeneration warning)
  - **Repaint button** (amber, prominent): opens RepaintModal
  - **Lighting section** (IC-Light): environment preset dropdown, temperature slider, manual override toggle → opens full relighting panel
  - **Effects section**: list of active effects with intensity sliders, "+" to add more
  - **Colour Grade**: LUT selector, film emulation preset, quick ASC CDL sliders (Lift/Gamma/Gain)
  - **Transform**: position X/Y, scale, rotation, opacity, Ken Burns (for images)
  - Character lock indicator (if clip uses a vaulted character)
  - Transition settings for clip-in and clip-out

**RepaintModal**:
- Shows original clip on left, new prompt on right
- Motion vector matching toggle (auto-detects surrounding camera motion)
- Start/end frame previews (extracted from surrounding clips)
- Model selector — defaults to character-locked model if character present
- "Repaint" button → creates REPAINT job, shows SSE progress inline

**Transitions Library**: Draggable between clips on the timeline. Categories: Cut, Dissolve, Fade, Film Burn, Wipe, Zoom, Glitch, Custom (AI-generated). Premium transitions require PRO+.

---

### Ultimate Mode (`/ultimate`)

Everything in Advanced mode, plus:

**Colour Grading Panel** (replaces right panel in colour tab):
- Full ASC CDL wheels (Lift/Gamma/Gain as circular colour wheels)
- Shadows/Midtones/Highlights luminance sliders
- Temperature and Tint sliders
- LUT import (drag-and-drop .cube file, intensity 0-100%)
- Film emulation presets: Kodak 5219, Fuji 3510, Kodak 2383, B&W Contrast, Custom
- Colour space selector: Rec.709, DCI-P3, Rec.2020
- Waveform and vectorscope displays (rendered via canvas)
- "Harmonise all clips" button — runs texture harmonisation across entire timeline

**Audio Mixing Board** (bottom panel in audio tab):
- One vertical fader per audio track (volume 0-200%)
- Pan knob per track (-100 to +100)
- 3-band EQ per track (Low/Mid/High shelves)
- Master bus: volume fader, compressor toggle, limiter toggle
- Dolby Atmos Spatial toggle (flags export for spatial audio processing)
- Foley generator: click on empty voice/SFX track section → text prompt → generate foley via AudioCraft

**VFX Compositor Panel**:
- Layer list with blend mode selector per VFX clip (Normal, Screen, Multiply, Add, Overlay)
- Opacity slider per layer
- Mask tools: rectangular, elliptical, freehand, luminance key, chroma key
- Built-in SFX asset library: Weather (rain, snow, fog, lightning), Practical FX (fire, smoke, explosion, sparks), Optical FX (lens flare, light leak, film burn, halation, vignette), Motion FX (motion blur, chromatic aberration, glitch), Particles (dust, bokeh, stars, confetti)
- "Generate custom VFX" — text prompt → AI-generated VFX clip inserted as new layer

**CGI Insertion Panel**:
- Select frame range on timeline
- Text prompt for 3D object ("add a hovering drone above the building")
- Surface attachment point picker (click on preview frame)
- Auto-lighting match toggle (uses IC-Light to match scene)
- Render quality: Draft (fast) / Final (accurate)
- Progress shows 3D generation → compositing stages

**AI Director Panel**:
- Creative brief textarea
- Style picker: Noir Thriller / Epic Action / Heartwarming Drama / Documentary / Sci-Fi / Horror / Comedy / Custom
- Target duration slider
- Characters to feature (multi-select from vault)
- "Direct my film" → runs `runAIDirector()` → populates entire timeline
- Director's notes section: Claude explains its creative decisions

**Storyboard Generator**:
- Upload or paste script/treatment text
- "Generate storyboard" → Claude parses script into shots → generates storyboard frames via Flux Pro
- Each storyboard frame becomes a generation prompt for the corresponding clip
- Export storyboard as PDF

**Continuity Checker**:
- "Run continuity check" button
- Analyses entire timeline via Claude Vision
- Returns colour-coded error list with jump-to-clip buttons
- Severity: Warnings (yellow) and Errors (red)

**Multi-Camera Editor**:
- Import multiple video files shot simultaneously (same timecode)
- AI auto-selects best angle based on: face visibility, motion clarity, audio quality
- Manual override: click any camera angle at any point to switch

**Export Options**:
- Social: MP4 H.264, up to 4K, optimised for platform (TikTok/Instagram/YouTube presets)
- Professional: ProRes 422, ProRes 4444, up to 8K
- Cinema: DCP (Digital Cinema Package) — requires STUDIO tier
- Spatial: Apple Vision Pro (.mvhevc), Meta Quest — requires STUDIO tier
- C2PA metadata injection: auto-embeds provenance data in every export

---

## ZUSTAND STORE DEFINITIONS

`src/store/editor.ts`:
```typescript
interface EditorStore {
  recipe: TimelineRecipe | null
  selectedClipId: string | null
  playheadTime: number
  isPlaying: boolean
  zoomLevel: number              // pixels per second
  scrollOffset: number           // timeline scroll position
  activeTab: 'generate' | 'vault' | 'library' | 'location' | 'transitions'
  activePanelRight: 'properties' | 'colour' | 'audio' | 'vfx' | 'cgi' | 'director'
  generatingJobIds: Set<string>  // jobs currently in progress on timeline
  
  setRecipe: (recipe: TimelineRecipe) => void
  selectClip: (clipId: string | null) => void
  setPlayheadTime: (t: number) => void
  addClip: (trackId: string, clip: Clip) => void
  updateClip: (clipId: string, updates: Partial<Clip>) => void
  removeClip: (clipId: string) => void
  reorderClips: (trackId: string, clipIds: string[]) => void
  addGeneratingJob: (jobId: string, clipId: string) => void
  resolveGeneratingJob: (jobId: string, outputUrl: string) => void
}
```

---

## TRAINING DATA COLLECTION (TELEMETRY)

Every user interaction that has training value must be captured silently:

`src/lib/telemetry/delta.ts`:
```typescript
// Called automatically after every REPAINT job completion
export async function captureRepaintDelta(params: {
  userId: string
  originalVideoUrl: string
  instruction: string        // the repaint prompt
  newVideoUrl: string
  modelUsed: string
  contextClips: string[]     // surrounding clip URLs for context
}): Promise<void>
// Writes to TrainingData table with type='repaint_delta'
// This is the highest-value training signal
```

`src/lib/telemetry/rlhf.ts`:
```typescript
// Called when user selects one output from multiple variants
export async function capturePreference(params: {
  userId: string
  promptText: string
  variants: Array<{ modelUsed: string, videoUrl: string }>
  selectedIndex: number
}): Promise<void>
// Writes to RLHFLog table
// Also writes to TrainingData with type='preference'
```

Capture ALL of these events:
- Every Repaint (delta capture)
- Every time a user downloads one clip from multiple generated variants (preference)
- Every time a user adjusts IC-Light settings (lighting preference)
- Every Auto-Social edit list acceptance/rejection
- Every character-locked model use (consistency training pair)

---

## SECURITY & HARDENING

1. **All API routes**: Validate session via NextAuth, attach userId from JWT, never trust client-provided userId
2. **Input validation**: Use Zod schemas on ALL request bodies. Reject any request failing validation with 400.
3. **Credit guardrail**: Check credits before queuing ANY paid job. Never queue then check.
4. **Content moderation**: Run `checkNSFW()` on ALL generated video/image outputs before delivering to client. Hold for review if flagged.
5. **Rate limiting**: Redis sliding window per userId per endpoint (see middleware.ts spec above)
6. **File upload validation**: Check MIME type and file size server-side on all uploads. Max 500MB video, max 20MB image.
7. **R2 signed URLs**: Generate with 7-day TTL. Never expose bucket directly.
8. **Stripe webhooks**: Verify `stripe-signature` header on all webhook endpoints. Use `stripe.webhooks.constructEvent()`.
9. **C2PA metadata**: Inject on every export using FFmpeg `-metadata` flags: `generated_by`, `models_used`, `generation_timestamp`, `project_id_hash`.
10. **API cost guardrails**: Log every external API call to `ApiUsageLog`. Implement per-day spend cap per user tier: FREE=$0.50, PRO=$5, STUDIO=$50. Alert admin when exceeded.

---

## TEST COVERAGE REQUIREMENTS

Write Jest tests for:
- `routeToModel()` — all tier/scene/character combinations
- `checkAndDeductCredits()` — concurrent deduction race conditions
- `catmullRomSpline()` — geometric accuracy
- `TimelineRecipe` schema validation (Zod)
- BullMQ job creation and priority ordering
- All fal.ai client functions (mock fal API responses)
- Rate limiter (Redis mock)

Write Playwright E2E tests for:
- Complete Simple Mode generation flow
- Repaint workflow end-to-end
- Character vault creation
- Export from Advanced mode

---

## BUILD ORDER — EXECUTE IN THIS EXACT SEQUENCE

**Step 1**: Scaffold, Prisma schema, db/redis singletons, env vars. Run `prisma db push`. Verify DB connection.

**Step 2**: Auth (NextAuth), credits system, Stripe webhook. Test login with Google and credits purchase.

**Step 3**: BullMQ queues, SSE streaming endpoint, DAS pull worker. Test job creation and SSE events end-to-end.

**Step 4**: fal.ai layer — IC-Light, AuraSR, Depth Anything, SadTalker, Whisper, REMBG, Flux proxy. Test each function individually.

**Step 5**: Video model farm — all model clients + router. Test routing logic with mock API responses. Add real Kling + Luma calls first (most stable APIs).

**Step 6**: Timeline schema, FFmpeg renderer, proxy system, harmonise pass. Test render with a 2-clip recipe.

**Step 7**: Character vault — create, LoRA trigger, model lock, IP-Adapter injection. Location engine — Mapillary, Cesium, OSM fallback.

**Step 8**: Audio pipeline — Suno, ElevenLabs, AudioCraft, beat detection. Auto-Social endpoint.

**Step 9**: Simple Mode UI — complete with all tabs (text, image, audio, auto-social). Connect to all backend endpoints. SSE progress display.

**Step 10**: Advanced Mode UI — Timeline, Preview, GeneratePanel, VaultPanel, PropertiesPanel, RepaintModal. Full drag-and-drop, scrubbing, playback.

**Step 11**: Ultimate Mode — ColourGrading, AudioMixer, VFXCompositor, CGIInsertion, AIDirector, ContinuityChecker, StoryboardAI, SpatialExport.

**Step 12**: Content moderation, rate limiting, C2PA injection, telemetry/RLHF capture. Full security audit.

**Step 13**: Test suite (Jest + Playwright). Performance profiling. Load test the queue under concurrent users.

---

## FINAL MANDATE

This application must be the most advanced AI video production platform ever built. Every feature described in this document is mandatory. Do not skip, stub, or simplify any system. Every API integration must be real and functional. The UI must be pixel-perfect professional. The timeline must be fluid and responsive. The AI model routing must be intelligent and cost-efficient. The training data collection must be comprehensive and silent. The result must be something that makes Adobe, CapCut, and Runway engineers uncomfortable.

Build it to that standard.

---

# GROWTH ENGINE BRAIN — COMPLETE SPECIFICATION

> This section defines the proprietary intelligence infrastructure that powers CINÉMA. It is the most strategically important part of the entire system. The two user-facing apps (CINÉMA and Loophole Detective) exist primarily as loss-leaders to feed this engine. Build every component in this section completely.

---

## ARCHITECTURE OVERVIEW — THE TWO-MODEL SYSTEM

The Growth Engine runs on exactly two in-house open-weight models. No exceptions. No proprietary closed-weight models in the core serving path (The Council is a fallback and distillation source only, never primary).

**Geopolitical constraint**: Only Western/European open-weight models are used in the two-model core. This is a hard architectural rule for sanction-proofing and supply chain security.

```
┌─────────────────────────────────────────────────────────┐
│                    USER REQUEST                          │
└────────────────────────┬────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │      MODEL 1        │  ← THE BRAIN & ART DIRECTOR
              │  Llama 4 Vision MoE │
              │  or Pixtral Large   │
              │                     │
              │ • All reasoning     │
              │ • JSON routing      │
              │ • Visual analysis   │
              │ • Payload writing   │
              │ • Art direction     │
              └──────────┬──────────┘
                         │  Writes structured generation payload
                         │  (prompt, parameters, references, constraints)
              ┌──────────▼──────────┐
              │      MODEL 2        │  ← THE NATIVE MUSCLE
              │  Mochi 1 Preview    │
              │  or Stable Video 4D │
              │                     │
              │ • ZERO reasoning    │
              │ • Pixel computation │
              │ • Video generation  │
              │ • Image synthesis   │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │    OUTPUT + LOG     │  → Training Cluster (isolated)
              └─────────────────────┘
```

---

## MODEL 1 — THE BRAIN & ART DIRECTOR

**Target**: `meta-llama/Llama-4-Scout-17B-16E-Instruct` (Vision MoE) or `mistralai/Pixtral-Large-Instruct-2411`

**Primary**: Llama 4 Vision MoE (preferred — superior multimodal reasoning, MoE architecture means lower compute per token, open weights available via Meta)

**Fallback**: Pixtral Large (Mistral AI — European, fully open, strong vision capabilities)

**Role**: Model 1 performs ALL cognitive work in the system. It never generates pixels. It:

1. **Reads and understands user intent** — parses natural language prompts, visual references, style descriptions
2. **Writes structured generation payloads** — produces precise JSON instructions for Model 2 and all external APIs
3. **Acts as Art Director** — decides composition, camera angle, lighting mood, colour palette, pacing
4. **Performs visual analysis** — analyses uploaded images, extracted frames, location plates
5. **Orchestrates multi-step workflows** — manages the Auto-Social edit list, AI Director film assembly, continuity checking
6. **Runs agentic reasoning loops** — Plan → Critique → Revise before finalising any complex output

### Model 1 Self-Hosting Setup

```typescript
// src/lib/brain/model1.ts

import Anthropic from '@anthropic-ai/sdk'

// Primary: Local Llama 4 Vision MoE via Ollama or vLLM
// The model runs on the local DAS rig's GPU cluster
// Fallback chain: Local → Replicate → Council (Claude)

export interface Model1Config {
  endpoint: string          // Local vLLM or Ollama endpoint
  model: string             // 'llama4-scout-vision' or 'pixtral-large'
  contextWindow: number     // 128000 tokens for Llama 4
  maxTokens: number
  temperature: number       // 0.3 for routing, 0.7 for creative
}

export const MODEL1_CONFIG: Model1Config = {
  endpoint: process.env.MODEL1_ENDPOINT!,   // e.g. http://localhost:11434/v1
  model: process.env.MODEL1_NAME!,           // 'llama4-scout-vision-instruct'
  contextWindow: 128000,
  maxTokens: 4096,
  temperature: 0.3,
}

// Core inference function — ALL Model 1 calls go through here
export async function runModel1(params: {
  systemPrompt: string
  userMessage: string
  images?: string[]         // base64 or URLs for vision tasks
  requireJSON?: boolean     // if true: enforce JSON output schema
  schema?: object           // Zod schema for output validation
  useAgenticLoop?: boolean  // if true: run Plan→Critique→Revise
}): Promise<{ content: string, usage: TokenUsage, latencyMs: number }>
```

### Environment Variables for Model 1

```env
# Model 1 — Primary (local vLLM server on DAS rig)
MODEL1_ENDPOINT="http://192.168.1.100:8000/v1"
MODEL1_NAME="meta-llama/Llama-4-Scout-17B-16E-Instruct"
MODEL1_API_KEY="local-key"

# Model 1 — Fallback (Replicate hosted)
MODEL1_REPLICATE_ENDPOINT="https://api.replicate.com/v1/models/meta/llama-4-scout/predictions"
REPLICATE_API_TOKEN=""

# Council (distillation source + hard fallback only)
ANTHROPIC_API_KEY=""          # Claude — already in env
DEEPSEEK_API_KEY=""           # DeepSeek — for chain-of-thought distillation
```

### Model 1 System Prompts — Film Production Context

```typescript
// src/lib/brain/prompts.ts

export const ART_DIRECTOR_SYSTEM_PROMPT = `
You are the Art Director and Brain of CINÉMA, the world's most advanced AI film production platform.

Your role is to receive user intent and translate it into precise, structured generation payloads for downstream AI video models.

You have deep knowledge of:
- Film grammar: shot types (ECU, CU, MCU, MS, WS, EWS, POV, OTS), camera movements (pan, tilt, dolly, crane, handheld, steadicam), editing rhythm
- Cinematography: lighting setups (Rembrandt, butterfly, split, backlight), colour theory, depth of field, lens choices
- Visual storytelling: narrative arc, emotional pacing, scene transitions, visual motifs
- Technical constraints of each AI video model (Kling excels at motion, Veo3 excels at photorealism, Seedance at character consistency)

When writing generation payloads you always:
1. Specify exact camera angle and movement
2. Define lighting: key light direction, fill ratio, colour temperature, motivated source
3. Describe subject action with precise verbs
4. Include environment details: time of day, weather, texture, depth
5. Specify the emotional register the scene must convey
6. Flag any character consistency requirements

Return ONLY valid JSON matching the schema provided. No preamble, no explanation, no markdown fences.
`

export const ROUTING_SYSTEM_PROMPT = `
You are the intelligent router for CINÉMA's AI model farm.

Given a user request, you determine:
1. The optimal quality tier (draft/standard/premium/cinematic/film)
2. The specific model to use and why
3. The estimated credit cost
4. Any pre-processing steps required (character reference injection, location plate, etc.)

Model capabilities you know precisely:
- wan/hunyuan: budget, fast, acceptable quality, no character lock
- luma: smooth camera motion, environment shots, no character support
- pika: object-level editing, good for close-ups
- minimax: long-form (up to 6min), consistent quality
- kling_standard: action, motion fidelity, moderate character consistency
- kling_pro: premium character lock, cinematic quality
- seedance: best character consistency across shots, dialogue scenes
- runway_gen4: multi-shot character continuity, professional grade
- veo3: photorealistic, physics-aware, native audio, top-tier quality
- sora: complex world simulation, extended physics, rare fallback

Return ONLY valid JSON.
`

export const AUTO_SOCIAL_SYSTEM_PROMPT = `
You are a world-class social media film editor with expertise in viral content creation.

You will receive a collection of visual assets (images and video clips). Your job is to craft the most compelling, emotionally resonant short-form video possible from these materials.

Your edit decisions must consider:
- Emotional arc: establish → develop → peak → resolution
- Pacing: match energy to music, use beat-cuts on downbeats
- Visual variety: alternate between wide establishing shots and close emotional details
- Story: identify the implicit narrative in the raw assets and amplify it
- Platform optimisation: different rhythms for TikTok vs Instagram vs YouTube Shorts

Return ONLY valid JSON matching the AutoSocialRecipe schema.
`
```

---

## MODEL 2 — THE NATIVE MUSCLE (DiT)

**Target**: `genmo-ai/mochi-1-preview` or `Stability-AI/stable-video-diffusion-img2vid-xt`

**Primary**: Mochi 1 (Genmo — Apache 2.0 licence, fully open, Western origin, strong motion quality)

**Fallback**: Stable Video Diffusion XT (Stability AI — UK-based, open weights, widely deployed)

**Role**: Model 2 does ZERO reasoning. It receives a structured payload from Model 1 and computes pixels. It is a pure Diffusion Transformer operating in inference mode during serving, and as the fine-tuning target during training.

```typescript
// src/lib/brain/model2.ts

export interface Model2InferencePayload {
  prompt: string              // Crafted by Model 1 — rich, precise
  negativePrompt: string      // Also crafted by Model 1
  numFrames: number           // 25fps × duration
  fps: number
  resolution: { width: number, height: number }
  guidanceScale: number       // 7.5 default, Model 1 adjusts per scene type
  numInferenceSteps: number   // 50 for quality, 20 for proxy
  seed?: number
  conditioningFrames?: string[]   // For V2V — Model 1 extracts these
  loraWeights?: string            // R2 path to fine-tuned weights
  ipAdapterImages?: string[]      // Character references from vault
}

// Self-hosted on DAS rig GPU cluster via Diffusers
export async function runModel2Inference(
  payload: Model2InferencePayload,
  onProgress?: (step: number, total: number) => void
): Promise<{ videoUrl: string, inferenceMs: number }>

// Falls back to fal.ai hosted Mochi if local GPU OOM
export async function runModel2Fallback(
  payload: Model2InferencePayload
): Promise<{ videoUrl: string }>
```

### Model 2 Local Infrastructure

```env
# Model 2 — Local Diffusers server on DAS rig
MODEL2_ENDPOINT="http://192.168.1.100:8001"
MODEL2_DEVICE="cuda"          # NVIDIA GPU on DAS rig
MODEL2_DTYPE="float16"        # BF16 if A100/H100

# Model 2 — fal.ai fallback (pay-per-inference)
MODEL2_FAL_MODEL="fal-ai/mochi-v1"
```

---

## THE COUNCIL — FALLBACK & DISTILLATION SOURCE

The Council is NOT used for primary inference in production. It serves two purposes only:

### Purpose 1: Hard Fallback
When Model 1 fails (OOM, timeout, quality gate failure) on a task requiring high reasoning quality (AI Director mode, complex continuity analysis, storyboard generation):

```typescript
// src/lib/brain/council.ts

export async function callCouncil(params: {
  task: string
  messages: Array<{ role: string, content: string }>
  requireJSON?: boolean
  reason: string              // Why Council is being called — logged for distillation
}): Promise<{ content: string, model: string, usage: TokenUsage }>

// Priority order:
// 1. Claude (Anthropic) — claude-sonnet-4-20250514
// 2. DeepSeek — deepseek-reasoner (for mathematical/logical tasks)
// 
// EVERY Council call is logged with:
// - The full input messages
// - The full output including any <thinking> blocks
// - The task type and reason
// - The quality score assessed by Model 1
// All logged data feeds directly into the distillation pipeline
```

### Purpose 2: IQ Distillation Source
The Council's hidden reasoning (`<thinking>` blocks from Claude, chain-of-thought from DeepSeek) is the training signal that makes Model 1 progressively smarter. See Training Cluster section.

```env
DEEPSEEK_API_KEY=""
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
```

---

## THE AGENTIC REASONING LOOP (TEST-TIME COMPUTE)

Before returning any complex output, Model 1 runs an internal Plan → Critique → Revise loop. This happens entirely within the Node.js orchestration layer — it does not require additional model infrastructure.

```typescript
// src/lib/brain/agentic-loop.ts

export interface AgenticLoopConfig {
  maxIterations: number       // Default: 3
  qualityThreshold: number    // 0-1 score below which revision is triggered
  taskType: 'routing' | 'creative' | 'analysis' | 'film_direction'
}

export async function runAgenticLoop<T>(params: {
  task: string
  initialContext: string
  schema: ZodSchema<T>
  config: AgenticLoopConfig
}): Promise<{ result: T, iterations: number, chainOfThought: string[] }>

// Implementation:
// ITERATION 1 — PLAN:
//   Model 1 receives task + context
//   Produces structured plan: "I will first... then... finally..."
//   Produces initial output attempt
//
// ITERATION 2 — CRITIQUE:
//   Model 1 receives its own output from iteration 1
//   System prompt: "You are a harsh critic. Identify every flaw in this output.
//                   Score it 0-10. Be specific about what is wrong."
//   If score >= qualityThreshold: accept output, exit loop
//   If score < threshold: continue to Revise
//
// ITERATION 3 — REVISE:
//   Model 1 receives original task + iteration 1 output + critique
//   Produces revised output addressing every critique point
//   Accept revised output regardless of score
//
// ALL iterations' chain-of-thought is captured and logged
// to TrainingData for distillation pipeline
```

### Tree Search for Complex Film Direction

For AI Director mode specifically, implement a simplified Monte Carlo Tree Search:

```typescript
// src/lib/brain/tree-search.ts

export async function treeSearchFilmPlan(params: {
  brief: string
  characters: VaultCharacter[]
  targetDuration: number
  numBranches: number         // Default: 3 — generate 3 alternative edit plans
  depthLimit: number          // Scene depth to explore
}): Promise<TimelineRecipe>

// 1. Generate N alternative film plans from Model 1 in parallel
// 2. Score each plan: Model 1 evaluates narrative coherence, pacing, character arcs
// 3. Select highest-scoring plan
// 4. Expand that plan to full scene-by-scene recipe
// 5. Log all branches and scores to TrainingData
//    (rejected branches are valuable negative examples for RLAIF)
```

---

## ISOLATED TRAINING CLUSTER

The Training Cluster is a completely separate system. It:
- **Never shares infrastructure with the live Growth Engine**
- **Never receives live traffic**
- **Only pushes to production after strict quality gates**
- Runs on the DAS rig on a separate GPU partition during off-peak hours

### Training Cluster Architecture

```
LIVE GROWTH ENGINE                    TRAINING CLUSTER
(production servers)                  (DAS rig — isolated)
        │                                     │
        │  TrainingData rows                  │
        │  ──────────────────────────────►   │
        │  (isProcessed: false)               │
        │                                     ├── Data Pipeline
        │                                     │   (clean, dedupe, format)
        │                                     │
        │                                     ├── Distillation Jobs
        │                                     │   (CoT extraction from Council)
        │                                     │
        │                                     ├── DPO Training
        │                                     │   (preference pairs → weights)
        │                                     │
        │                                     ├── Quality Gate
        │                                     │   (benchmark eval suite)
        │                                     │
        │  Verified weight checkpoint         │
        │  ◄──────────────────────────────── │
        │  (only if all benchmarks pass)      │
```

### Training Data Pipeline

```typescript
// src/workers/training-pipeline.ts
// Run as separate Node.js process on DAS rig — never on production servers

export async function runDataPipeline(): Promise<void> {
  // 1. Fetch unprocessed TrainingData rows (isProcessed: false)
  //    Batch size: 1000 rows per run
  
  // 2. Deduplicate: remove near-identical prompts using embedding similarity
  
  // 3. Format each data type:
  
  //    TYPE: 'repaint_delta'
  //    Format: { instruction: string, before: videoUrl, after: videoUrl }
  //    Training signal: "Given this video, apply this edit → produce this output"
  //    THIS IS THE HIGHEST VALUE SIGNAL — prioritise in all training runs
  
  //    TYPE: 'preference'
  //    Format: { prompt, chosen: videoUrl, rejected: videoUrl }
  //    Training signal: DPO preference pairs for RLAIF
  
  //    TYPE: 'council_distillation'
  //    Format: { task, thinking: string, output: string }
  //    Training signal: teach Model 1 the Council's reasoning patterns
  
  //    TYPE: 'routing_decision'
  //    Format: { context, chosen_model, reasoning }
  //    Training signal: improve Model 1's routing decisions
  
  // 4. Write formatted data to DAS_TRAINING_PATH as JSONL
  //    One file per data type per batch
  
  // 5. Mark rows as isProcessed: true
  
  // 6. Trigger training job if batch size exceeds threshold
}
```

### IQ Scaling — Chain-of-Thought Distillation

```typescript
// src/workers/distillation.ts

export async function distillCouncilReasoning(): Promise<void> {
  // Fetch all CouncilCallLog entries where distilled: false
  // For each Council call with <thinking> blocks:
  
  // 1. Extract the <thinking> content (Claude's hidden reasoning)
  // 2. Extract the final answer
  // 3. Create a training example:
  //    { input: task_prompt, thinking: extracted_reasoning, output: final_answer }
  // 4. Format as instruction-following fine-tuning data for Llama 4
  // 5. Write to distillation JSONL dataset
  
  // This teaches Model 1 to reproduce the Council's reasoning patterns
  // without requiring the Council's inference cost at serving time
  
  // After 500+ distillation examples: trigger LoRA fine-tune of Model 1
  //   Use HuggingFace PEFT + TRL SFTTrainer on DAS rig GPUs
}

export async function runRLAIF(): Promise<void> {
  // RLAIF: Reinforcement Learning from AI Feedback
  // Use preference pair data to run DPO (Direct Preference Optimisation)
  
  // 1. Load preference pairs from training data (chosen vs rejected outputs)
  // 2. Score each pair using Council: "Which of these outputs is better and why?"
  // 3. Use Council scores as reward signal
  // 4. Run DPO training on Model 1 weights using TRL DPOTrainer
  // 5. Target: improve Model 1's ability to predict which generations users prefer
  
  // DPO hyperparameters:
  //   beta: 0.1
  //   learning_rate: 1e-5
  //   batch_size: 16
  //   num_epochs: 1 (incremental — run frequently with small batches)
}
```

### Training on Model 2 (DiT Fine-Tuning)

```typescript
// src/workers/dit-finetune.ts

export async function fineTuneModel2(): Promise<void> {
  // Fine-tune Mochi/SVD on domain-specific generation data
  // Target: improve quality on CINÉMA-specific content types:
  //   - Character consistency across scenes
  //   - Film-look aesthetic preferred by users (from RLHF)
  //   - Specific lighting conditions (urban night, golden hour)
  
  // Training data: repaint_delta pairs where Model 2 is the generator
  //   Each pair: (prompt + context) → high-quality output
  
  // Use HuggingFace Diffusers fine-tuning:
  //   DreamBooth for character-specific LoRAs
  //   Full fine-tune for domain adaptation (run quarterly on large batches)
  
  // Hardware: DAS rig GPUs (A100 or H100 recommended, minimum RTX 4090 x4)
}
```

### Quality Gate — Weight Verification

```typescript
// src/workers/quality-gate.ts

interface BenchmarkResult {
  passed: boolean
  scores: {
    coherence: number          // 0-1 — does output make sense?
    routingAccuracy: number    // 0-1 — does routing match expert labels?
    preferenceAlignment: number // 0-1 — do users prefer new model vs old?
    regressionDelta: number    // negative = worse than baseline
    safetyScore: number        // 0-1 — no harmful outputs
  }
}

export async function runQualityGate(
  newWeightsPath: string
): Promise<BenchmarkResult> {
  // Run new weights against held-out evaluation suite:
  
  // 1. ROUTING BENCHMARK (100 labelled examples)
  //    Load test prompts with ground-truth model assignments
  //    Measure routing accuracy vs expert labels
  //    Pass threshold: > 0.85
  
  // 2. PREFERENCE BENCHMARK (50 A/B pairs)
  //    Generate outputs with old weights vs new weights
  //    Council scores both outputs
  //    Pass threshold: new weights preferred in > 55% of pairs
  
  // 3. REGRESSION CHECK
  //    Run 20 standard test prompts
  //    Compare output quality scores to baseline
  //    Pass threshold: no more than 5% degradation on any metric
  
  // 4. SAFETY CHECK
  //    Run 30 adversarial prompts designed to elicit harmful content
  //    Pass threshold: 0 harmful outputs
  
  // If ALL gates pass: approve weight push
  // If ANY gate fails: quarantine weights, alert team, do NOT push to production
}

export async function pushVerifiedWeights(
  weightsPath: string,
  canaryPercentage: number = 1   // Start at 1% traffic
): Promise<void> {
  // Upload weights to R2
  // Update MODEL1_WEIGHTS_PATH env var via deployment config
  // Enable canary: route canaryPercentage of traffic to new weights
  // Monitor for 24h — if error rate unchanged: increase to 10%, then 50%, then 100%
  // If error rate increases: immediate rollback
}
```

---

## THE DATA FLYWHEEL — HOW CINÉMA FEEDS THE BRAIN

Every user interaction in CINÉMA is a training signal. This is the core business moat:

```typescript
// src/lib/telemetry/flywheel.ts

// Capture points — implement ALL of these in the editor:

// 1. REPAINT DELTA (highest value)
//    Every time: user highlights clip + types new instruction + Repaint fires
//    Captures: { original_video, instruction_text, new_video, model_used }
//    Value: direct supervised fine-tuning data for video editing
//    Expected volume: 5-20 per active user per session

// 2. GENERATION PREFERENCE
//    Every time: user generates 2+ variants, downloads/adds one to timeline
//    Captures: { prompt, all_variants, chosen_index, rejected_indices }
//    Value: DPO preference pairs for RLAIF
//    Expected volume: 2-5 per active user per session

// 3. PROMPT REFINEMENT
//    Every time: user edits a prompt and regenerates
//    Captures: { original_prompt, refined_prompt, context }
//    Value: prompt quality improvement training signal
//    Expected volume: 3-10 per session

// 4. LIGHTING PREFERENCE
//    Every time: user adjusts IC-Light settings and confirms
//    Captures: { before_frame, lighting_params, after_frame }
//    Value: lighting preference dataset unique to this platform

// 5. CHARACTER CONSISTENCY
//    Every successful multi-scene generation with same character
//    Captures: { character_ref, scene_1_url, scene_2_url, model_used }
//    Value: character consistency training pairs

// 6. ROUTING FEEDBACK (implicit)
//    When user regenerates a clip with a different model
//    Captures: { prompt, original_model, rejected=true, new_model }
//    Value: routing decision refinement

// 7. AUTO-SOCIAL ACCEPTANCE
//    When user accepts or modifies the AI-generated edit list
//    Captures: { assets, proposed_edit, accepted: bool, modifications: diff }
//    Value: editing preference dataset

export async function captureFlywheelSignal(
  type: string,
  data: Record<string, unknown>,
  userId: string
): Promise<void> {
  await db.trainingData.create({
    data: {
      userId,
      type,
      metadata: data,
      isProcessed: false,
    }
  })
  
  // Increment user's contribution count
  // Users who contribute most training data get priority queue and bonus credits
  // (This is a subtle flywheel accelerator — rewards the most active users)
}
```

---

## LOOPHOLE DETECTIVE — THE SECOND DATA SOURCE

The second app (accounting/tax strategy tool) feeds the Growth Engine's logical reasoning capability. This trains Model 1 to handle dense, structured, rule-based reasoning — the exact opposite of creative generation tasks. Together, CINÉMA (creative) + Loophole Detective (logical) produce a Model 1 that is both artistically capable and rigidly precise.

```typescript
// src/lib/loophole/index.ts
// This is a separate Next.js app, but shares the Training Cluster infrastructure

// Loophole Detective generates:
// TYPE: 'tax_logic_chain'
//   Input: tax code section + business scenario
//   Council output: full reasoning chain + conclusion
//   Distillation: teaches Model 1 multi-step logical deduction
//   Volume: 50-200 queries per active user per session

// TYPE: 'schema_parse'
//   Input: financial document (PDF/table)
//   Output: structured JSON extraction
//   Trains Model 1 on dense document understanding

// TYPE: 'strategy_critique'
//   Input: proposed tax strategy
//   Council output: critique + risk assessment
//   Trains Model 1 adversarial reasoning (find the flaw)
```

---

## NODE.js ORCHESTRATION — FULL PIPELINE

All of this runs in Node.js TypeScript. No Python. The orchestration layer that connects Model 1 → Model 2 → external APIs → training pipeline:

```typescript
// src/lib/brain/orchestrator.ts

export class GrowthEngineOrchestrator {
  
  async processGenerationRequest(request: GenerationRequest): Promise<GenerationResult> {
    
    // STEP 1: Model 1 — understand intent + write payload
    const artDirectorPayload = await runAgenticLoop({
      task: 'art_direction',
      initialContext: JSON.stringify(request),
      schema: GenerationPayloadSchema,
      config: { maxIterations: 3, qualityThreshold: 0.75, taskType: 'creative' }
    })
    
    // STEP 2: Check vault locks + inject character references
    if (request.characterId) {
      const lock = await getLockedModelFamily(request.characterId)
      if (lock) artDirectorPayload.result.model = lock
      artDirectorPayload.result.ipAdapterImages = await getCharacterRefs(request.characterId)
    }
    
    // STEP 3: Route to correct model (Model 2 local or external API)
    const modelId = routeToModel(
      artDirectorPayload.result.qualityTier,
      artDirectorPayload.result.sceneType,
      !!request.characterId,
      request.userRole
    )
    
    // STEP 4: Model 2 or external API inference
    let result: GenerateVideoOutput
    if (modelId === 'mochi' || modelId === 'svd') {
      result = await runModel2Inference(artDirectorPayload.result)
    } else {
      result = await routeToExternalModel(modelId, artDirectorPayload.result)
    }
    
    // STEP 5: Post-processing pipeline
    result = await runPostProcessing(result, request)
    
    // STEP 6: Capture training signals
    await captureFlywheelSignal('generation_complete', {
      request, artDirectorPayload: artDirectorPayload.chainOfThought, result, modelId
    }, request.userId)
    
    // STEP 7: LoRA auto-trigger check
    if (request.characterId) {
      await checkLoraAutoTrigger(request.characterId, request.projectId)
    }
    
    return result
  }
}
```

---

## ADDITIONAL ENVIRONMENT VARIABLES FOR GROWTH ENGINE

```env
# Model 1 — Local inference server (vLLM recommended)
MODEL1_ENDPOINT="http://192.168.1.100:8000/v1"
MODEL1_NAME="meta-llama/Llama-4-Scout-17B-16E-Instruct"
MODEL1_API_KEY="local"
MODEL1_FALLBACK_ENDPOINT="https://api.replicate.com/v1"
REPLICATE_API_TOKEN=""

# Model 2 — Local Diffusers inference server
MODEL2_ENDPOINT="http://192.168.1.100:8001"
MODEL2_NAME="genmo/mochi-1-preview"
MODEL2_FAL_FALLBACK="fal-ai/mochi-v1"

# Council (distillation + fallback only)
DEEPSEEK_API_KEY=""
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"

# Training Cluster (DAS rig — separate machine)
TRAINING_CLUSTER_HOST="192.168.1.101"
TRAINING_CLUSTER_API_KEY=""
TRAINING_DATA_SYNC_INTERVAL="3600"   # seconds — hourly sync to training cluster

# Council Call Logging
COUNCIL_CALL_LOG_ENABLED="true"
COUNCIL_DISTILLATION_BATCH_SIZE="500"

# Quality Gate Thresholds
QG_ROUTING_ACCURACY_THRESHOLD="0.85"
QG_PREFERENCE_THRESHOLD="0.55"
QG_REGRESSION_MAX_DELTA="-0.05"
QG_CANARY_PERCENTAGE="1"
```

---

## GROWTH ENGINE BUILD ORDER (ADD TO MAIN BUILD SEQUENCE)

After completing the main 13-sprint build, execute these additional sprints:

**Sprint 14**: Set up local vLLM server on DAS rig. Download Llama 4 Scout weights. Configure `MODEL1_ENDPOINT`. Replace all current `@anthropic-ai/sdk` direct calls in routing/art direction with `runModel1()`. Verify Model 1 handles all routing, payload writing, and visual analysis tasks. Council remains as fallback only.

**Sprint 15**: Set up local Diffusers inference server on DAS rig. Download Mochi 1 weights. Implement `runModel2Inference()`. Wire to BullMQ render worker so `modelId === 'mochi'` routes to local GPU. Benchmark inference speed vs fal.ai hosted — local should be 40-60% cheaper per generation.

**Sprint 16**: Implement `runAgenticLoop()`. Add Plan→Critique→Revise to: AI Director mode, Auto-Social edit list generation, complex routing decisions. Verify chain-of-thought is captured to TrainingData on every agentic run.

**Sprint 17**: Implement full telemetry flywheel — all 7 capture points in the editor. Verify TrainingData rows are being created on every Repaint, preference, and refinement event. Build admin dashboard showing training data volume by type.

**Sprint 18**: Build training pipeline worker (`das-pull` sibling process). Implement `runDataPipeline()`, `distillCouncilReasoning()`, `runRLAIF()`. Set up scheduled jobs (cron on DAS rig). First training run with accumulated data.

**Sprint 19**: Implement `runQualityGate()` and `pushVerifiedWeights()`. Test the full loop: generate data → train → gate → canary deploy. Verify rollback works correctly.

**Sprint 20**: Loophole Detective app scaffold — separate Next.js project, shared Training Cluster. Implement accounting/tax query flow with Council as primary (Loophole Detective CAN use Council as primary since precision > cost here). Capture all reasoning chains to shared TrainingData table.

---

## THE COMPOUND MOAT

After 12 months of operation with 10,000+ active users:

- **500,000+ repaint delta pairs** — the world's largest video editing instruction dataset
- **2,000,000+ preference pairs** — RLHF signal that no lab can replicate from scratch
- **100,000+ Council reasoning chains** — distilled IQ that makes Model 1 progressively smarter
- **50,000+ character consistency pairs** — the foundation for a proprietary character generation model
- **Geo-matched generation pairs** — location plate + generated scene = grounded geographic model

This dataset is worth more than the application itself. It is the true asset. Guard it accordingly — encrypt at rest, access-log every query, never expose raw training data via API.


---

# COMPETITIVE GAP ANALYSIS — MANDATORY ADDITIONS
## Features competitors have that must be added to CINÉMA

> Based on full review of: Adobe Premiere Pro 2025, DaVinci Resolve 20/21, Adobe After Effects 25.5, Foundry Nuke, Final Cut Pro 11, CapCut 2025, and Runway Aleph (2025). All items below are gaps — features elite competitors ship that were missing from the previous architecture. Every item is mandatory.

---

## GAP 1 — OPTICAL FLOW RETIMING & SLOW MOTION

**Who has it**: Premiere Pro (Morph Cut), DaVinci Resolve (optical flow), After Effects (Pixel Motion Blur), Final Cut Pro (Smooth Slo-Mo via Neural Engine), Nuke.

**What's missing**: CINÉMA has no frame interpolation system. Users cannot create smooth slow-motion from standard frame-rate footage, and cannot retime clips without dropped frames.

**Implementation**:
Add to `src/lib/timeline/retime.ts`:
```typescript
export async function opticalFlowRetime(params: {
  videoUrl: string
  targetFps: number          // e.g. 120 for super slow-mo from 30fps
  section?: { start: number, end: number }  // retime only a portion
  quality: 'draft' | 'full'
}): Promise<{ retimedUrl: string }>
// Use fal.ai FILM (Frame Interpolation for Large Motion) model
// fal.run('fal-ai/film-video-frame-interpolation', { video_url, target_fps })
// For ultra slow-mo: generate intermediate frames via optical flow
// Fallback: ffmpeg minterpolate filter for draft quality

export async function morphCut(params: {
  clipAUrl: string
  clipBUrl: string           // two takes of same dialogue
  overlapFrames: number      // frames to morph across
}): Promise<{ morphedUrl: string }>
// AI-blended cut between two takes — eliminates jump cuts in talking heads
// Use: extract last N frames of clip A + first N of clip B
// Run FILM interpolation across the overlap
```

Add to Timeline UI (Advanced + Ultimate modes):
- Right-click clip → "Retime" → speed percentage slider (1% to 400%)
- "Optical flow interpolation" toggle (on = smooth, off = frame duplicate)
- "Slow-Mo section" — drag to mark a range within a clip for partial retiming
- Morph Cut tool — drag between two clips on dialogue track to auto-blend

---

## GAP 2 — VISUAL NODE-BASED COMPOSITOR (Ultimate mode)

**Who has it**: DaVinci Resolve Fusion (200+ nodes), Foundry Nuke (the Hollywood standard), Adobe After Effects.

**What's missing**: CINÉMA's VFX compositor is layer-based only. Power VFX users (and the Ultimate tier promises "film-grade") need node-based compositing for complex multi-element shots. Fusion and Nuke are the gold standard.

**Implementation** — add `src/components/studio/NodeCompositor.tsx`:

Build a canvas-based node graph using React + a lightweight graph library (or custom):
```typescript
interface CompositorNode {
  id: string
  type: NodeType
  position: { x: number, y: number }
  inputs: NodePort[]
  outputs: NodePort[]
  params: Record<string, unknown>
}

type NodeType =
  | 'MediaIn'       // import a clip or image
  | 'MediaOut'      // render result to timeline
  | 'Merge'         // composite two streams (fg over bg, blend modes)
  | 'Transform'     // position, scale, rotate, crop
  | 'ColorCorrect'  // lift/gamma/gain per-node
  | 'Blur'          // gaussian, directional, radial
  | 'Keyer'         // chroma key / luma key
  | 'Mask'          // bezier/spline mask with feathering
  | 'Tracker'       // 2D point + planar tracker
  | 'DepthMap'      // depth-aware compositing
  | 'LUT'           // 3D LUT application node
  | 'Grain'         // film grain matching
  | 'Glow'          // optical glow
  | 'Defocus'       // depth-of-field blur with depth map
  | 'Text3D'        // 3D extruded text node
  | 'Particle'      // GPU particle emitter
  | 'Background'    // procedural background generator
  | 'TimeOffset'    // frame delay/advance
```

Render: compile node graph → FFmpeg filtergraph string → execute
Node UI: drag nodes from panel, connect with bezier cables, double-click to open params inspector

Start with 20 essential nodes for launch. Expand to 50+ post-launch. Label the feature "Fusion-class compositor" in marketing.

---

## GAP 3 — PLANAR & SURFACE TRACKER

**Who has it**: Premiere Pro, DaVinci Resolve Fusion, After Effects (Mocha AE), Nuke, Final Cut Pro (mTracker Surface via plugin, now acquired by Apple).

**What's missing**: CINÉMA has REMBG background removal and depth maps but no planar tracking. Without this, users cannot: pin text/graphics to a moving surface, replace signs or screens in footage, or perform region-isolated colour correction that tracks moving objects.

**Implementation**:
Add to `src/lib/timeline/tracker.ts`:
```typescript
export async function trackPlanarRegion(params: {
  videoUrl: string
  regionOfInterest: { x: number, y: number, width: number, height: number }  // first frame ROI
  trackingMethod: 'translation' | 'affine' | 'perspective'
}): Promise<{
  trackData: Array<{
    frame: number
    corners: [Point, Point, Point, Point]  // four corners of tracked quad
    confidence: number
  }>
}>
// Use fal.ai CoTracker or ByteTrack for point tracking
// Upgrade to DINO-based semantic tracking for robust surface tracking
// Return track data as JSON — client uses this to position overlay elements

export async function replaceTrackedSurface(params: {
  videoUrl: string
  trackData: TrackData
  replacementImageUrl: string    // what to pin to the surface
  blendMode: string
}): Promise<{ compositedUrl: string }>
// Apply replacement image warped to tracked quad using perspective transform
// FFmpeg perspective filter per frame with computed homography matrices
```

UI: Add "Track" tool to timeline toolbar. User draws ROI on frame, hits Track, system returns quad path. Attach any clip/image/graphic to the tracked surface. Essential for sign replacement, screen replacement, logo insertion.

---

## GAP 4 — GPU PARTICLE SYSTEM ENGINE

**Who has it**: DaVinci Resolve Fusion (particle system), Adobe After Effects (Particular plugin / built-in), Final Cut Pro Motion (Gravity, Throw, Vortex behaviours), Nuke (particles).

**What's missing**: CINÉMA's SFX library contains pre-rendered particle effects but no real-time generative particle system. Film-grade productions need custom particle control — emitters, physics forces, collision, lifespan control.

**Implementation**:
Add `src/components/studio/ParticleEngine.tsx` — Three.js GPU particle system:
```typescript
interface ParticleEmitter {
  type: 'point' | 'sphere' | 'cone' | 'mesh'
  position: Vector3
  emitRate: number               // particles per second
  lifetime: { min: number, max: number }
  velocity: { direction: Vector3, spread: number, magnitude: Range }
  size: Range
  color: { start: Color, end: Color }
  opacity: { start: number, end: number }
  forces: Force[]                // gravity, wind, vortex, turbulence
  collision: boolean
  renderMode: 'billboard' | 'stretched' | 'mesh'
  texturePath?: string
}

// Render via Three.js InstancedMesh for GPU performance
// Export: each frame baked to PNG → FFmpeg png sequence → overlay on video
// Presets: fire, smoke, sparks, rain, snow, dust, confetti, magic, bokeh
```

---

## GAP 5 — FULL OPENCOLORIO (OCIO) + RAW CAMERA INGESTION

**Who has it**: DaVinci Resolve (ACES 2.0, full OCIO, every RAW format), Nuke (OCIO), Premiere Pro (many RAW formats), Final Cut Pro (Canon/Nikon/Sony RAW).

**What's missing**: CINÉMA currently accepts uploaded video files and treats them as web-ready. A film-grade system must handle RAW camera files (BRAW, R3D, ARRI ARI, Sony RAW, Canon CRM, Nikon N-RAW) and apply proper colour transforms via OpenColorIO before any processing.

**Implementation**:
Add to `src/lib/storage/raw-ingest.ts`:
```typescript
export const SUPPORTED_RAW_FORMATS = [
  'braw',    // Blackmagic RAW
  'r3d',     // RED RAW
  'arri',    // ARRI
  'mxf',     // XAVC / DNxHD / ProRes
  'crm',     // Canon Cinema RAW Light
  'nraw',    // Nikon N-RAW
  'sraw',    // Sony RAW
]

export async function ingestRAWFile(filePath: string): Promise<{
  proxiedVideoUrl: string
  colorProfile: string        // detected colour space (LogC, S-Log3, etc.)
  ocioTransform: string       // OCIO config transform to Rec.709
  metadata: CameraMetadata
}>
// Use FFmpeg with libraw / BRAW SDK to decode RAW
// Apply OCIO transform: camera native → scene-linear → display
// Generate low-res proxy for timeline scrubbing
// Store original RAW on DAS, proxy on R2

// OCIO config: ship the default ACES 2.0 config with the app
// Bundle: https://github.com/AcademySoftwareFoundation/OpenColorIO-Config-ACES
```

Add to colour grading panel: dropdown showing detected colour space, override option, transform preview.

---

## GAP 6 — MOTION GRAPHICS TEMPLATE LIBRARY (MoGRT)

**Who has it**: Premiere Pro (100+ new in 2025, Film Impact acquisition), DaVinci Resolve (100+ Krokodove + Animated titles), Final Cut Pro (1,900+ Motion assets + MotionVFX acquisition), CapCut (template library).

**What's missing**: CINÉMA has no built-in motion graphics library. While the VFX compositor can create custom graphics, there is no browse-and-drop library of professional lower thirds, title cards, transitions, and animated graphics.

**Implementation**:
Add `src/components/studio/MotionGraphicsLibrary.tsx`:

Library categories to build/source:
- **Titles**: Lower thirds (30 styles), main titles (20 styles), end cards
- **Transitions**: Film burns (12), light leaks (8), ink wash (6), glitch (10), geometric (15), particle (8)
- **Social**: TikTok/Reel caption styles (30), progress bars, like/follow CTAs
- **UI/Data**: Animated charts, maps, timelines, quote cards
- **Broadcast**: News tickers, sports scoreboards, breaking news

Each template is a Remotion composition (JSON-parameterised) that renders via the programmatic video engine. Users customise: text, colours, timing, font. Drag to timeline to insert.

```typescript
interface MotionGraphicsTemplate {
  id: string
  category: string
  name: string
  tags: string[]
  previewGifUrl: string       // 2-second preview animation
  remotionComponentId: string // maps to a Remotion component
  defaultParams: Record<string, unknown>
  editableParams: TemplateParam[]
}
```

Ship with 200 templates at launch. AI-generate new templates on demand: user describes desired graphic → Model 1 writes Remotion JSON → rendered and saved to their library.

---

## GAP 7 — COLLABORATIVE MULTI-USER EDITING SESSION

**Who has it**: DaVinci Resolve (Blackmagic Cloud multi-user), Adobe (Frame.io integration), Premiere Pro (shared projects).

**What's missing**: CINÉMA has `socket.io` in the stack but collaborative editing was not fully specified. Film productions require multiple editors working the same timeline simultaneously.

**Implementation** — add to `src/app/(editor)/advanced/page.tsx` and `src/lib/collab/`:
```typescript
// Real-time collaborative editing via socket.io
// Each user has a cursor visible to others (coloured by user avatar)
// Conflict resolution: last-write-wins per clip, lock mechanism for in-progress edits
// Presence panel: shows who is in the session, what they're editing
// Comment threads: right-click frame → add comment → resolve thread
// Version history: snapshot timeline state every 5 minutes → restore any version

interface CollabSession {
  projectId: string
  participants: Participant[]
  activeClipLocks: Map<string, string>  // clipId → userId
  comments: Comment[]
  snapshots: TimelineSnapshot[]
}
```

---

## GAP 8 — SCRIPTING & PLUGIN API

**Who has it**: DaVinci Resolve (Python + Lua), Premiere Pro (ExtendScript + CEP panels), After Effects (ExtendScript), Nuke (Python).

**What's missing**: No extensibility API. Power users and studios cannot automate workflows or build custom integrations.

**Implementation** — add `src/app/api/plugin/route.ts`:
```typescript
// Node.js plugin API — studios can build custom extensions
// Authenticated via API key (Studio tier only)
// Exposed endpoints:
//   GET  /api/plugin/timeline — read current timeline recipe
//   POST /api/plugin/timeline/clip — add a clip programmatically
//   POST /api/plugin/jobs — create generation jobs
//   GET  /api/plugin/vault — read character and location vault
//   POST /api/plugin/export — trigger export

// Webhook support: studio can register a URL to receive job completion events
// JavaScript SDK: publish @cinema-ai/sdk to npm

// This enables:
//   - Studio pipeline integration (Shotgrid, ftrack, NIM)
//   - Custom automation scripts
//   - Third-party plugin marketplace (long-term)
```

---

## GAP 9 — OPTICAL FLOW STABILISATION

**Who has it**: Premiere Pro (Warp Stabiliser), DaVinci Resolve (gyro stabiliser), Final Cut Pro (stabilisation), CapCut (AI stabiliser), After Effects (Warp Stabiliser VFX).

**What's missing**: No video stabilisation tool. Uploaded or generated shaky footage cannot be smoothed.

**Implementation**:
Add to `src/lib/timeline/stabilise.ts`:
```typescript
export async function stabiliseVideo(params: {
  videoUrl: string
  strength: 'smooth' | 'locked' | 'cinematic'  // cinematic = gentle floating
  cropRatio: number   // how much to crop edges to compensate for shift (0-0.2)
}): Promise<{ stabilisedUrl: string }>
// Use FFmpeg vidstabdetect + vidstabtransform two-pass stabilisation
// For cinematic mode: constrained stabilisation that preserves intentional camera movement
// For locked: full tripod-style lock
```

Add to clip properties panel: "Stabilise" toggle with strength slider.

---

## GAP 10 — DEDICATED FAIRLIGHT-CLASS AUDIO DAW

**Who has it**: DaVinci Resolve Fairlight (full professional DAW — 6-band EQ, dynamics, reverb, delay, ADR, Foley recorder, Atmos mixer, AI IntelliCut, AI Dialogue Matcher, Chain FX).

**What's missing**: CINÉMA's audio mixer has faders and basic EQ but lacks professional audio post-production tools that Fairlight provides and that film productions require.

**Add to audio mixer** (`src/components/studio/AudioMixer.tsx`):
```typescript
// Professional audio tools to add:

// 1. Plugin insert chain (per track)
//    - Parametric EQ (6 band, per-band type: shelf / peak / notch)
//    - Compressor (threshold, ratio, attack, release, knee)
//    - Gate / Expander
//    - Reverb (room size, decay, pre-delay, wet/dry)
//    - Delay (time, feedback, sync to BPM)
//    - De-esser (frequency targeted sibilance reduction)
//    - Limiter (mastering-grade brick wall)

// 2. AI Dialogue tools (match DaVinci Fairlight AI)
//    - AI IntelliCut equivalent: auto-remove silences from dialogue tracks
//    - Speaker separation: split multi-speaker audio to separate tracks
//    - AI Dialogue Matcher: match tone/level/reverb across different recording sessions
//    - AI background noise removal (beyond basic Whisper cleanup)

// 3. ADR (Automated Dialogue Replacement) workflow
//    - Loop record: cycle playback of selected range while recording
//    - Multiple take management
//    - Guide track mute during record

// 4. Foley recorder
//    - Record live audio synced to video playback
//    - Timestamp-snap recorded clips to video

// 5. Audio bus routing
//    - Sub-mix buses (dialogue bus, music bus, SFX bus, Atmos bus)
//    - Master bus processing chain
//    - Stem export: separate each bus to individual file

// Implementation: extend AudioMixSettings schema with full plugin chain
// Process: FFmpeg audio filter chains for all DSP (equalizer, acompressor, areverb, etc.)
// AI tools: fal.ai audio models + Whisper-based speaker diarisation
```

---

## UPDATED FEATURE COUNT POST-GAP ANALYSIS

| Category | Before gap analysis | After additions |
|---|---|---|
| Core editing tools | 10 | 13 (+optical flow, stabiliser, text-based edit) |
| Colour science | 9 | 12 (+OCIO, RAW ingest, collaborative grade) |
| AI generation | 8 | 8 (already leads) |
| VFX compositing | 9 | 15 (+node graph, planar tracker, particle engine) |
| 3D / CGI | 7 | 10 (+USD, MoGRT library, particle behaviours) |
| Audio production | 8 | 16 (+full Fairlight-class DAW) |
| Character / lipsync | 6 | 6 (already leads) |
| Social / content | 5 | 5 (already leads) |
| Location / world | 5 | 5 (already leads) |
| AI production | 5 | 5 (already leads) |
| Export / delivery | 5 | 6 (+OCIO-correct export) |
| Plugin / scripting | 0 | 1 (+plugin API) |
| **Total** | **77** | **106** |

---

## THE DEFINITIVE COMPETITOR KILL STATEMENT

After implementing all gaps above, CINÉMA will be the **only platform** that simultaneously has:

1. Every feature Premiere Pro has — plus AI generation it will never ship
2. Every feature DaVinci Resolve Fusion has — plus AI video generation it doesn't have
3. Every feature CapCut has — plus film-grade capabilities it will never build
4. Every feature Runway Aleph has — plus full non-linear editing it's not building
5. The **only platform** with: multi-model AI routing, character vault with LoRA auto-training, real-world location sourcing, IC-Light relighting, autonomous AI Director, C2PA content provenance, and an isolated self-improving training cluster

No other platform combines all five. This is not incremental improvement — it's a category collapse.


---

# UPSCALING PIPELINE — COMPLETE SPECIFICATION

> Upscaling is a first-class feature, not an afterthought. Every competitor offers some form of it. CINÉMA must offer the most comprehensive, multi-engine upscaling system available — covering video, image, and export-time enhancement, with AI model selection based on content type.

---

## UPSCALING TIERS & ENGINE SELECTION

```typescript
// src/lib/upscale/router.ts

export type UpscaleEngine =
  | 'aura_sr'          // fal-ai/aura-sr — best for photorealistic video frames
  | 'real_esrgan'      // fal-ai/real-esrgan — best for anime / illustrated content
  | 'esrgan_plus'      // fal-ai/esrgan — general purpose, fast
  | 'codeformer'       // fal-ai/codeformer — face-priority restoration + upscale
  | 'clarity_upscaler' // fal-ai/clarity-upscaler — adds realistic detail / texture
  | 'topaz_ffmpeg'     // ffmpeg super2xsai / lanczos for fast proxy upscale
  | 'ffmpeg_native'    // ffmpeg bicubic/lanczos — no AI, instant, free

export type UpscaleFactor = 2 | 4 | 8

export interface UpscaleJob {
  inputUrl: string
  targetFactor: UpscaleFactor
  contentType: 'photorealistic' | 'anime' | 'cgi' | 'face_heavy' | 'text_heavy' | 'general'
  outputResolution?: { width: number, height: number }   // override factor with exact res
  denoise: boolean
  sharpen: number       // 0-1
  faceEnhance: boolean  // run CodeFormer pass on detected faces after upscale
  preserveFilmGrain: boolean
  tileSize?: number     // tile large frames to avoid VRAM OOM
}

export function routeUpscaleEngine(job: UpscaleJob): UpscaleEngine {
  if (job.contentType === 'face_heavy') return 'codeformer'
  if (job.contentType === 'anime') return 'real_esrgan'
  if (job.contentType === 'cgi') return 'clarity_upscaler'
  if (job.targetFactor === 8) return 'aura_sr'        // only AuraSR handles 8x reliably
  if (job.targetFactor === 4) return 'aura_sr'
  if (job.targetFactor === 2) return 'esrgan_plus'    // fastest for 2x
  return 'aura_sr'
}
```

---

## UPSCALE MODES — ALL FOUR MUST BE IMPLEMENTED

### Mode 1 — Per-Clip Upscale (Timeline)

User right-clicks any clip on the timeline → "Upscale clip" → opens upscale panel:

- Factor selector: 2x / 4x / 8x
- Content type auto-detected by Model 1 (VLM analyses a frame sample)
- Engine auto-selected but overridable
- Face enhance toggle (runs CodeFormer pass after primary upscale)
- Film grain preserve toggle (adds matching grain back post-upscale so the clip doesn't look over-processed)
- Preview: fal.ai proxy upscale on a single frame in under 5 seconds before committing
- Cost displayed in credits before confirmation

```typescript
// src/lib/upscale/clip.ts

export async function upscaleClip(params: {
  videoUrl: string
  job: UpscaleJob
  onProgress?: (pct: number) => void
}): Promise<{ upscaledUrl: string, resolutionOut: Resolution }>

// Process:
// 1. Extract all frames as PNG sequence via FFmpeg
// 2. Tile frames if resolution > 1024px (prevents VRAM OOM)
// 3. Batch upscale frames via fal.ai (max 20 concurrent requests)
// 4. If faceEnhance: run CodeFormer on each frame after primary upscale
// 5. Reassemble PNG sequence → video via FFmpeg (preserve original audio)
// 6. If preserveFilmGrain: analyse original grain level → apply matched grain
// 7. Upload to R2, return URL
// 8. Log to TrainingData: original + upscaled pair (valuable training signal)
```

### Mode 2 — Export-Time Upscale (Render Pipeline)

On export, add upscale as a post-processing stage in the render pipeline. This is the most common professional use case — edit at 1080p, export at 4K.

```typescript
// src/lib/timeline/export.ts — add upscale stage

export interface ExportSettings {
  // ... existing fields ...
  upscale?: {
    enabled: boolean
    targetResolution: '2K' | '4K' | '8K' | 'custom'
    customResolution?: { width: number, height: number }
    engine: UpscaleEngine | 'auto'
    faceEnhance: boolean
    denoise: boolean
  }
}

// In the export pipeline after FFmpeg render:
// if (settings.upscale?.enabled):
//   chunk video into 10-second segments
//   upscale each segment in parallel via fal.ai
//   reassemble with FFmpeg concat
//   apply audio from original render (do not re-encode audio)
```

UI: In export dialog, add "Upscale" section:
- Toggle: "Upscale output"
- Target: 2K / 4K / 8K / Custom
- Quality: Standard (AuraSR 4x) / Maximum (AuraSR 4x + CodeFormer + detail enhance)
- Estimated time and credit cost displayed before export

### Mode 3 — Batch Project Upscale

For Ultimate tier users who want to upscale an entire project's clip library at once (e.g. SD archive footage being upgraded for a 4K deliverable).

```typescript
// src/app/api/upscale/batch/route.ts

// POST { projectId, clipIds: string[], job: UpscaleJob }
// Creates one BullMQ job per clip in the upscale queue
// Priority: lower than generation jobs (background task)
// SSE stream: reports per-clip progress back to client
// On completion: replaces clip sourceUrl in TimelineRecipe with upscaled URL
// Sends notification when all clips complete
```

### Mode 4 — Single Image Upscale (Simple Mode + Vault)

In Simple Mode, allow standalone image upscaling. In the Vault, auto-upscale character reference images to maximum resolution before embedding or training LoRA.

```typescript
// src/lib/upscale/image.ts

export async function upscaleImage(params: {
  imageUrl: string
  factor: UpscaleFactor
  contentType: UpscaleJob['contentType']
  faceEnhance?: boolean
}): Promise<{ upscaledUrl: string, widthOut: number, heightOut: number }>

// Use:
//   fal.run('fal-ai/aura-sr', { image_url, upscaling_factor: factor })
//   If faceEnhance: also run fal.run('fal-ai/codeformer', { image_url: upscaledUrl, fidelity: 0.75 })

// Auto-upscale in vault:
//   When user uploads character reference images < 512px
//   Auto-run 4x upscale before face embedding extraction
//   Improves LoRA training quality significantly
```

---

## ENGINE SPECIFICATIONS

### AuraSR (Primary — fal-ai/aura-sr)
- Best for: photorealistic video frames, general content, 4x and 8x
- Speed: ~2s per frame at 4x on fal.ai serverless GPU
- Max resolution: handles up to 2048px input (tile for larger)
- Preserves: fine texture, skin detail, fabric
- Credit cost: 3 credits per clip minute at 4x

### Real-ESRGAN (Anime / Illustrated — fal-ai/real-esrgan)
- Best for: animation, illustrated content, CGI renders, cartoon style
- Variants: `RealESRGAN_x4plus_anime_6B` for animation, `RealESRGAN_x4plus` for general
- Preserves: clean lines, flat colour areas, cel shading
- Credit cost: 2 credits per clip minute at 4x

### CodeFormer (Face Priority — fal-ai/codeformer)
- Best for: talking head content, interview footage, character close-ups
- Fidelity slider: 0 = maximum restoration (may alter likeness), 1 = preserve identity
- Recommended: 0.7 fidelity for AI-generated characters, 0.9 for real people
- Always run as a second pass AFTER primary upscale — never as standalone
- Credit cost: 2 credits per clip minute

### Clarity Upscaler (Detail Enhancement — fal-ai/clarity-upscaler)
- Best for: CGI content, architectural shots, product shots requiring sharp detail
- Adds plausible new detail beyond simple interpolation
- Uses diffusion process — slower but highest perceptual quality
- Credit cost: 5 credits per clip minute (most expensive — use for finals only)

### ESRGAN+ (Fast 2x — fal-ai/esrgan)
- Best for: quick 2x upscale of proxy footage, fast preview quality check
- Fastest engine — returns in under 1s per frame
- Credit cost: 1 credit per clip minute

### FFmpeg Native (Free — no credits)
- Bicubic, Lanczos, Spline interpolation
- No AI — no detail hallucination
- Use for: proxy generation, thumbnail creation, social-format resize
- Always available regardless of credit balance

---

## FACE ENHANCEMENT PIPELINE (POST-UPSCALE)

AI-generated faces often suffer from temporal inconsistency and soft detail. The face enhancement pass runs after every upscale job when `faceEnhance: true`:

```typescript
// src/lib/upscale/face-enhance.ts

export async function enhanceFacesInVideo(params: {
  videoUrl: string
  fidelity: number        // 0-1 — how much to restore vs preserve original
  detectionThreshold: number   // confidence threshold for face detection
}): Promise<{ enhancedUrl: string, facesDetected: number }>

// Process per frame:
// 1. fal-ai/face-id: detect and localise all faces
// 2. Crop each face region with padding
// 3. fal-ai/codeformer on each crop at specified fidelity
// 4. Paste enhanced face back onto frame using Poisson blending
//    (prevents visible seam at face boundary)
// 5. Reassemble enhanced frames → video

// Temporal smoothing:
// Apply slight blend between adjacent frames' face enhancements
// to prevent flickering (common issue with per-frame face restoration)
// Blend weight: 0.15 from previous frame, 0.70 current, 0.15 next frame
```

---

## GRAIN PRESERVATION SYSTEM

A critical detail competitors miss: upscaling removes film grain, making AI-generated content look unnaturally clean and "digital." CINÉMA must match and restore grain after upscaling.

```typescript
// src/lib/upscale/grain.ts

export async function matchAndRestoreGrain(params: {
  originalVideoUrl: string    // pre-upscale clip (has original grain)
  upscaledVideoUrl: string    // post-upscale (grain removed by upscaler)
  grainStrength?: number      // override — 0 = no grain, 1 = full match
}): Promise<{ grainedUrl: string }>

// 1. Analyse original: extract grain profile via FFT frequency analysis
//    Measure: grain size, intensity, colour channel distribution, temporal variation
// 2. Generate matching grain: FFmpeg geq filter with matched parameters
//    OR: use fal.ai grain model for organic-looking noise
// 3. Apply at correct intensity to upscaled video
// 4. Result: upscaled resolution with original film character preserved

// This is the detail that separates professional upscaling from consumer upscaling.
// DaVinci Resolve Studio has a dedicated "Film Grain" ResolveFX for exactly this.
```

---

## CREDIT COSTS — UPSCALING OPERATIONS

Add to `OPERATION_COSTS` in `src/lib/credits.ts`:

```typescript
// Upscaling costs (per minute of video)
upscale_2x_fast: 1,           // FFmpeg / ESRGAN+ 2x
upscale_4x_standard: 3,       // AuraSR 4x
upscale_4x_anime: 2,          // Real-ESRGAN 4x anime
upscale_4x_face: 4,           // AuraSR 4x + CodeFormer face pass
upscale_4x_maximum: 6,        // Clarity upscaler 4x + CodeFormer
upscale_8x: 10,               // AuraSR 8x — maximum resolution
upscale_image_2x: 1,          // Single image 2x
upscale_image_4x: 2,          // Single image 4x
upscale_image_face: 2,        // Image + CodeFormer
grain_restore: 1,             // Grain matching pass
face_enhance_only: 2,         // CodeFormer pass on existing video
```

---

## UI — UPSCALE PANEL SPECIFICATION

**In Timeline (right-click clip → Upscale)**:
- Resolution preview: shows "1920×1080 → 7680×4320" with file size estimate
- Engine card: auto-selected engine shown with explanation ("AuraSR selected for photorealistic content")
- Override dropdown: list all engines with quality/speed/cost comparison
- Toggles: Face enhance · Film grain preserve · Denoise
- Single frame preview button: upscales one frame in ~3 seconds via fal.ai to show result before full job
- Confirm button with credit cost displayed
- Progress: SSE-connected, shows frame-by-frame progress bar
- On completion: clip in timeline automatically updates to upscaled version (original preserved in DAS)

**In Export Dialog**:
- "Output quality" section at bottom
- Presets: Web (no upscale) / HD (2x if source < 1080p) / 4K (upscale to 4K) / Film (8K maximum quality)
- Estimated render time and credit cost per preset

**In Simple Mode**:
- After generation: "Enhance" button below each result card
- One-click → 4x upscale + face enhance runs automatically
- Shows before/after slider on completion

---

## ADDITIONAL SPRINT — ADD TO BUILD ORDER

**Sprint 21 — Upscaling Pipeline**:
1. Implement `src/lib/upscale/router.ts` — engine selection logic
2. Implement all engine clients (AuraSR, Real-ESRGAN, CodeFormer, Clarity, ESRGAN+, FFmpeg)
3. Implement `src/lib/upscale/clip.ts` — frame extraction → batch upscale → reassemble
4. Implement `src/lib/upscale/image.ts` — single image upscale + vault auto-upscale
5. Implement `src/lib/upscale/face-enhance.ts` — face detection + CodeFormer + Poisson blend
6. Implement `src/lib/upscale/grain.ts` — grain analysis + restoration
7. Add upscale to export pipeline (`src/lib/timeline/export.ts`)
8. Add batch upscale API endpoint
9. Build upscale panel UI component
10. Add all upscale credit costs and test billing flow
11. Wire SSE progress for upscale jobs
12. Test: 1080p clip → 4K upscale → verify grain restoration → verify face enhancement


---

# FINAL FEATURE GAP ADDITIONS
## 22 Missing Features Found in Competitor Audit — All Must Be Built

---

## GAP 1 — MOTION BRUSH (Runway-style granular element control)

### `src/components/editor/MotionBrush.tsx`

Canvas overlay on the video preview. User paints regions. Each region gets independent motion vector.

**UI**: Canvas painted over preview. Toolbar: brush sizes, eraser, region colours. Each painted region shows a directional arrow + speed slider. Regions can be: Move (any direction), Static (pin still), Attract (pull toward centre), Repel.

**Data model**:
```typescript
interface MotionBrushRegion {
  id: string
  maskDataUrl: string          // base64 painted mask
  motion: 'move' | 'static' | 'attract' | 'repel'
  direction?: { x: number, y: number }  // normalised vector
  speed: number                // 0-1
  label: string                // "clouds", "water", "person"
}
```

**Integration**: When generating with Motion Brush regions, convert masks to ControlNet-style conditioning. Inject into Kling 3.0 payload (best motion control API). For models without native brush support, use as soft guidance via img2img with the direction vectors encoded as optical flow fields.

---

## GAP 2 — ACT-TWO PERFORMANCE CAPTURE

### `src/lib/performance/ActTwo.ts`

User webcam → full body + face + hand tracking → drives character animation.

```typescript
export async function capturePerformance(params: {
  webcamVideoUrl: string      // user's recorded performance
  targetCharacterId: string   // who to apply it to
  captureMode: 'face_only' | 'body_face' | 'full_body_hands'
}): Promise<string>  // returns animated character video URL

// Pipeline:
// 1. DWPose on webcam video → full skeleton sequence (all 133 keypoints)
// 2. Face landmark extraction → 68-point facial action units
// 3. Hand keypoint extraction (MediaPipe Hands) → 21 points per hand
// 4. Load target character reference frame from vault
// 5. Apply pose sequence to character via ControlNet pose conditioning
// 6. Kling 3.0 with pose sequence as motion guide → animated character
// 7. LivePortrait for facial expression overlay → final output
```

**UI**: "Performance Capture" mode in Simple/Advanced. Webcam recording panel (3-60 seconds). Real-time skeleton preview during recording. Character selector. "Apply performance" → generates. Compare original webcam vs character animation side-by-side.

---

## GAP 3 — TRANSCRIPT-BASED EDITING (Descript-style)

### `src/components/editor/TranscriptEditor.tsx`

Full transcript-as-editing-surface. Requires Whisper (already in stack).

**Flow**:
1. User opens Transcript panel (toggle in timeline toolbar)
2. Whisper transcribes all dialogue tracks with word-level timestamps
3. Display transcript as editable text with each word linked to its timeline segment
4. User edits text (delete word → marks that video segment for removal)
5. "Apply edits" → removes all marked segments from timeline, ripple-shifts remaining clips

**Features**:
- Delete word/sentence → remove from video
- Click word in transcript → jumps playhead to that timecode
- Highlight range in transcript → select those timeline segments
- Search within transcript → highlights and navigates to all matches
- Export transcript as SRT/VTT/TXT

```typescript
interface TranscriptWord {
  word: string
  start: number     // seconds
  end: number
  confidence: number
  trackId: string   // which audio/video track
  clipId: string
  markedForRemoval: boolean
}
```

---

## GAP 4 — AI FILLER WORD & SILENCE REMOVAL

### `src/lib/audio/FillerRemover.ts`

```typescript
export async function removeFillersAndSilence(params: {
  projectId: string
  fillerWords: string[]      // default: ['um', 'uh', 'like', 'you know', 'sort of', 'basically', 'literally']
  silenceThresholdMs: number // remove pauses longer than this (default 500ms)
  sensitivity: 'aggressive' | 'moderate' | 'gentle'
  previewOnly: boolean       // if true, mark but don't remove
}): Promise<{
  removedSegments: Array<{ start: number, end: number, type: 'filler' | 'silence', text?: string }>
  timeSaved: number          // seconds removed
  clipCount: number
}>

// Implementation:
// 1. Whisper transcription with word timestamps on all dialogue tracks
// 2. Pattern match against fillerWords list
// 3. Detect silence gaps via FFmpeg silencedetect filter
// 4. Mark segments for removal
// 5. If !previewOnly: batch-remove from timeline with ripple shift
```

**UI**: "Clean Audio" button in the audio toolbar. Preview panel shows all detected fillers/silences with checkboxes. "Remove selected" or "Remove all". Slider for silence threshold.

---

## GAP 5 — STUDIO SOUND (AI dialogue enhancement)

### `src/lib/audio/StudioSound.ts`

```typescript
export async function enhanceDialogue(params: {
  audioUrl: string
  mode: 'voice_isolation' | 'noise_reduction' | 'studio_quality' | 'all'
  strength: number   // 0-1
}): Promise<{ enhancedUrl: string }>

// Implementation:
// voice_isolation: FFmpeg highpass filter + noise gate
// noise_reduction: fal-ai/audio-enhancement or speechbrain noise reduction
// studio_quality: EQ boost at 2-5kHz (voice presence), de-reverb, compression
// Apply to individual audio clips or the entire dialogue bus
```

**UI**: Right-click any audio clip → "Enhance dialogue". Or: Audio Mixer → Master → "Studio Sound" toggle. Strength slider. A/B preview before applying.

---

## GAP 6 — AI AVATAR SYSTEM

### `src/lib/avatar/AvatarEngine.ts`

```typescript
// Three modes:

// MODE 1: Instant Avatar (from user webcam)
export async function createInstantAvatar(params: {
  recordingUrl: string     // 2-3 min webcam recording
  userId: string
  name: string
}): Promise<{ avatarId: string, previewUrl: string }>
// Extract face + voice → ElevenLabs clone → SadTalker template

// MODE 2: Stock Avatar  
// 30+ pre-built diverse avatars stored as VaultCharacter entries
// Generated via Seedance with defined appearance vault

// MODE 3: Script to Avatar Video
export async function scriptToAvatarVideo(params: {
  script: string
  avatarId: string
  voiceSettings?: { pitch: number, speed: number, emotion: string }
  backgroundUrl?: string
  duration?: number
}): Promise<{ videoUrl: string }>
// ElevenLabs TTS → SadTalker + LivePortrait → composite over background

// MODE 4: Talking Photo
export async function talkingPhoto(params: {
  photoUrl: string
  audioUrl: string
}): Promise<{ videoUrl: string }>
// SadTalker: drive photo to speak matching the audio
```

**UI**: New section in Simple Mode: "Avatar Video". Step 1: Choose avatar (stock grid or create from webcam). Step 2: Write/paste script. Step 3: Select background (solid colour / uploaded image / AI generated from prompt). Generate. Also accessible from Vault panel: each character entry has "Create avatar video" button.

**Prisma model** — add to schema:
```prisma
model Avatar {
  id          String   @id @default(cuid())
  userId      String
  name        String
  type        String   // 'instant' | 'stock' | 'custom'
  videoUrl    String   // source recording for instant avatars
  thumbnailUrl String
  voiceId     String?
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}
```

---

## GAP 7 — DIRECTOR MODE CAMERA SLIDERS

Add to `src/components/editor/GeneratePanel.tsx`:

```typescript
interface CameraDirectorSettings {
  panDirection: number      // -100 (full left) to 100 (full right)
  panSpeed: number          // 0-1
  tiltDirection: number     // -100 (full down) to 100 (full up)
  zoomLevel: number         // 0.5 (zoom out) to 4.0 (4x zoom in)
  roll: number              // -30 to 30 degrees
  push: number              // -1 (dolly out) to 1 (dolly in)
  staticCamera: boolean     // lock camera completely
}

// Camera presets:
const CAMERA_PRESETS = {
  'Slow push in':     { push: 0.3, zoomLevel: 1.2, panDirection: 0, tiltDirection: 0 },
  'Ken Burns right':  { panDirection: 40, zoomLevel: 1.1, push: 0 },
  'Aerial reveal':    { tiltDirection: -60, zoomLevel: 0.8, push: -0.2 },
  'Static tripod':    { staticCamera: true },
  'Handheld walk':    { push: 0.5, panDirection: 15, tiltDirection: 5 },
  'Crane up':         { tiltDirection: -30, push: -0.3, zoomLevel: 0.9 },
}
// Convert slider values to model-specific camera conditioning strings
// for Kling's motion_config API parameter
```

---

## GAP 8 — AUTO REFRAME (Smart aspect ratio conversion)

### `src/lib/timeline/AutoReframe.ts`

```typescript
export async function reframeClip(params: {
  clipUrl: string
  targetAspectRatio: '9:16' | '1:1' | '4:5' | '16:9' | '4:3' | '21:9'
  subjectTracking: boolean   // if true, keep subject centred
}): Promise<{ reframedUrl: string }>

// Implementation:
// 1. Extract 1fps thumbnails from clip
// 2. YOLO/DETR object detection on each frame → subject bounding boxes
// 3. Smooth bounding box trajectory (Kalman filter)
// 4. Compute optimal crop for target ratio centred on subject path
// 5. FFmpeg crop + scale per frame using computed crop coordinates
// 6. Reassemble frames → video with matching audio

// For AI reframe (fills empty areas after crop):
// If landscape → portrait and subject is centred, there are empty side strips
// Option: fill with AI-generated continuation via img2img (blurred/extended background)
```

**UI**: Export dialog → "Platform variants" section → checkboxes for platforms → each selected → Auto Reframe applied. Also: right-click clip → Reframe → aspect ratio picker.

---

## GAP 9 — GENERATIVE CLIP EXTEND

### `src/lib/timeline/ClipExtend.ts`

```typescript
export async function extendClip(params: {
  clipUrl: string
  clipMetadata: { prompt: string, modelUsed: string, characterIds: string[] }
  direction: 'start' | 'end' | 'both'
  extensionSeconds: number   // 1-8 seconds per direction
  tier: OutcomeTier
}): Promise<{ extendedClipUrl: string }>

// END extension:
// 1. Extract last frame
// 2. Generate continuation via Seedance I2V (best for continuation)
//    with original prompt + "continuing naturally from previous scene"
// 3. 4-frame dissolve stitch
//    
// START extension:
// 1. Extract first frame
// 2. Generate pre-scene via I2V
// 3. Reverse generated clip
// 4. Stitch at beginning
//    
// Cost: charged as standard generation (per 5s block)
```

**UI**: Right-click clip on timeline → "Extend clip" → slider for how many seconds each direction → preview → apply.

---

## GAP 10 — FULL VIDEO TRANSLATION WORKFLOW

### `src/app/api/translate/video/route.ts`

Builds on existing cross-lingual lip sync spec. This is the complete pipeline:

```typescript
interface TranslationJob {
  sourceVideoUrl: string
  targetLanguage: string       // BCP-47 language code
  translateCaptions: boolean
  dubAudio: boolean
  resyncLips: boolean
  preserveOriginalAudio: boolean  // duck original under dubbed
  characterId?: string         // for voice consistency with vault
}

// Pipeline:
// 1. Whisper transcription → source transcript + word timestamps
// 2. Claude/DeepSeek translation → target language text
//    (preserve timing hints, don't translate proper nouns by default)
// 3. ElevenLabs multilingual TTS → dubbed audio
//    If characterId provided: use cloned voice in target language
//    Otherwise: auto-select closest matching voice for target language
// 4. Time-stretch dubbed audio to match original timing (±15% tolerance)
// 5. SadTalker lip resync to dubbed audio
// 6. Overlay dubbed audio (optionally ducking original)
// 7. Generate SRT captions in target language
// Returns: dubbed video + SRT file

// Supported via ElevenLabs multilingual v2: 29+ languages
// Supported via SadTalker: any language (audio-driven)
```

**UI**: In export dialog: "Translate & Dub" section. Language selector (flag + language name). Options: Subtitles only / Dub only / Both. Voice matching settings. Generate → shows per-step progress → download or add to project.

---

## GAP 11 — CLIENT REVIEW PORTAL

### New Prisma model:
```prisma
model ReviewLink {
  id          String    @id @default(cuid())
  projectId   String
  userId      String
  token       String    @unique @default(cuid())
  title       String
  status      String    @default("pending")  // pending | approved | changes_requested
  expiresAt   DateTime?
  allowDownload Boolean @default(false)
  comments    ReviewComment[]
  createdAt   DateTime  @default(now())
}

model ReviewComment {
  id            String    @id @default(cuid())
  reviewLinkId  String
  authorName    String
  authorEmail   String
  timecode      Float     // seconds
  clipId        String?
  text          String
  annotationData Json?    // SVG annotation drawn on frame
  resolved      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  link          ReviewLink @relation(fields: [reviewLinkId], references: [id])
}
```

### `src/app/review/[token]/page.tsx` — Public review page (no auth required):
- Plyr.js video player with custom controls
- Click anywhere on frame → annotation tool → floating comment bubble
- Comment is stored with exact timecode + annotation SVG
- Approve / Request Changes buttons → update ReviewLink.status
- Email notification sent to project owner

### `src/app/api/review/create/route.ts` — Create review link for a project export.

**UI in editor**: "Share for review" button in top nav → generates link → copy to clipboard. Review comments appear in editor as timeline markers with the reviewer's name.

---

## GAP 12 — BRAND KIT

### New Prisma model:
```prisma
model BrandKit {
  id              String   @id @default(cuid())
  userId          String
  name            String
  primaryColor    String   // hex
  secondaryColor  String   // hex
  accentColor     String   // hex
  fontFamily      String
  logoUrl         String?
  introClipUrl    String?  // branded intro animation
  outroClipUrl    String?  // branded outro animation
  lowerThirdStyle Json     // { font, color, position, animation }
  watermarkUrl    String?
  watermarkPosition String // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  watermarkOpacity Float   @default(0.6)
  isDefault       Boolean  @default(false)
  createdAt       DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id])
}
```

**Auto-apply**: When creating a new project, if user has a default BrandKit: auto-insert intro clip at start of timeline, outro at end, watermark on all generated clips, and pre-populate colour grade with brand colours. **UI**: Settings → Brand Kit → visual editor for all elements.

---

## GAP 13 — SMART HIGHLIGHT EXTRACTION (OpusClip-style)

### `src/app/api/highlights/extract/route.ts`

```typescript
// POST { videoUrl, targetCount, maxDuration, platform }
// 1. Whisper transcription of full video
// 2. Model 1 scores every 30-90s segment:
//    - Hook strength (does it start with something compelling?)
//    - Quotability (memorable, shareable statement?)
//    - Emotional intensity (peak energy moment?)
//    - Topic clarity (standalone comprehensible without context?)
//    - Visual dynamism (not just talking head?)
// 3. Return top N segments ranked by composite score
// 4. Extract via FFmpeg, add animated captions, auto-reframe for platform
// 5. Return ranked clip gallery with "virality scores"

interface HighlightClip {
  rank: number
  startTime: number
  endTime: number
  transcript: string
  viralityScore: number  // 0-100
  reason: string         // why Model 1 selected this
  clipUrl: string
  captionedUrl: string   // with animated captions
  verticalUrl?: string   // 9:16 version
}
```

---

## GAP 14 — OVERDUB (AI voice dialogue patch)

### `src/lib/audio/Overdub.ts`

```typescript
export async function overdubWord(params: {
  audioTrackUrl: string
  targetWord: { text: string, startTime: number, endTime: number }
  replacementText: string
  voiceId: string         // from vault — must be cloned voice
}): Promise<{ patchedAudioUrl: string }>

// 1. ElevenLabs TTS: generate replacement text in cloned voice
// 2. Match EQ profile: extract frequency response of original word
//    Apply matched EQ to generated audio so it blends seamlessly
// 3. Match room reverb: if original has room echo, add subtle reverb
// 4. Splice generated audio into exact timecode position
//    If replacement is longer: time-stretch to fit original duration (if < 20% stretch)
//    If > 20% difference: extend clip slightly to accommodate
```

**UI**: In Transcript panel — double-click any word → edit field appears → type replacement → "Synthesise" → preview → accept. Works only if character's ElevenLabs voice is cloned in vault.

---

## GAP 15 — STOCK ASSET LIBRARY

### `src/lib/stock/StockLibrary.ts`

```typescript
// Integrate Pexels API for video and photos (free commercial use)
// Integrate Free Music Archive for background music (licensed)
// Internal curated SFX library (500+ professionally recorded effects on R2)

export async function searchStockVideo(query: string, count?: number): Promise<StockAsset[]>
export async function searchStockMusic(query: string, mood?: string): Promise<StockAsset[]>
export async function searchSFX(query: string, category?: string): Promise<StockAsset[]>

interface StockAsset {
  id: string
  source: 'pexels' | 'fma' | 'cinema_sfx' | 'pixabay'
  type: 'video' | 'audio' | 'sfx'
  title: string
  previewUrl: string
  downloadUrl: string
  duration?: number
  license: string
  tags: string[]
}
```

**UI**: Library panel in left sidebar → tabs: Videos / Music / SFX. Search box. Grid/list results with preview on hover. Drag from library to timeline. SFX: click to preview audio → drag to audio track.

---

## SPRINT ADDITIONS — GAPS 1-15

**Sprint 37 — Motion Brush + Director Mode:**
Build canvas overlay for MotionBrush. Implement region masking with motion vectors. Director Mode camera sliders. Wire both into GeneratePanel. Test Kling 3.0 with motion brush conditioning.

**Sprint 38 — Act-Two Performance Capture:**
Build webcam recording panel. DWPose integration via fal.ai. LivePortrait expression transfer. Assemble full capture pipeline. Test with 30s performance video.

**Sprint 39 — Transcript Editing + Audio AI:**
Build TranscriptEditor component. Implement word-level deletion → timeline removal. FillerRemover.ts and StudioSound.ts. Overdub for cloned voice patching. Test full Descript-style workflow.

**Sprint 40 — Avatar System:**
InstantAvatar creation from webcam. Stock avatar library (20+ pre-built). Script-to-avatar-video pipeline. Talking Photo feature. Avatar mode in Simple Mode.

**Sprint 41 — Workflow Gaps:**
Auto Reframe with subject tracking. Generative Clip Extend. Client Review Portal (full Prisma model + public page + annotation tool).

**Sprint 42 — Distribution & Library:**
Full video translation pipeline (29 languages). Smart highlight extraction with virality scoring. Stock asset library (Pexels + FMA + SFX). Brand Kit with auto-apply.

**Sprint 43 — Platform integrations:**
Direct social publishing (TikTok, Instagram, YouTube). Scheduling queue. Basic performance metrics dashboard.
