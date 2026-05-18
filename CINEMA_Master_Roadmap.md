# CINÉMA — CINEMATIC FORGE BY INNOVATIVE
## Master System Roadmap — Complete Architecture Reference
### Version 2.0 | All Systems | All Dependencies | All Features

---

## TABLE OF CONTENTS

1. [Platform Identity & Positioning](#1-platform-identity)
2. [Complete System Architecture](#2-system-architecture)
3. [Technology Stack & Dependencies](#3-technology-stack)
4. [Database Architecture](#4-database-architecture)
5. [Environment Variables — Complete Index](#5-environment-variables)
6. [Feature Index — All 106 Features](#6-feature-index)
7. [API Endpoint Index](#7-api-endpoint-index)
8. [Omnichannel Media Routing Engine](#8-omnichannel-media-routing-engine)
9. [Landing Page & Authentication](#9-landing-page--authentication)
10. [Pricing & Token Economy](#10-pricing--token-economy)
11. [Knowledge Firewall & Intelligence Architecture](#11-knowledge-firewall)
12. [Growth Engine Brain](#12-growth-engine-brain)
13. [Sprint Plan — Indexed with Dependencies](#13-sprint-plan)
14. [File Structure — Complete Index](#14-file-structure)
15. [Dev Account & Access Control](#15-dev-account--access-control)

---

## 1. PLATFORM IDENTITY

**Product Name**: Cinematic Forge  
**By**: INNOVATIVE  
**Internal Codename**: CINÉMA  
**Tagline**: Professional AI Film Production. For Everyone.

**Market Position**: The only platform that simultaneously replaces:
- CapCut (consumer social video)
- Adobe Premiere Pro (professional NLE editing)
- Adobe After Effects (VFX compositing)
- DaVinci Resolve (colour grading + Fairlight audio)
- Runway / Kling / Veo (AI video generation)
- HeyGen (AI avatar video)
- Descript (transcript editing)
- Frame.io (client review)

**Three Interface Modes — One Backend:**
| Mode | Target User | Key Capability |
|---|---|---|
| Simple | Consumer / Social Creator | Text-to-video, Image-to-video, Auto-Social |
| Advanced | Professional Creator / Editor | Multi-track timeline, Repaint, Vault |
| Ultimate | Film Director / Studio | Full production suite, AI Director, Colour Science |

---

## 2. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CINEMATIC FORGE — SYSTEM MAP                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  CLIENT LAYER                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Landing Page │  │  Simple Mode │  │ Advanced Mode│               │
│  │ /            │  │  /simple     │  │  /advanced   │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│  ┌──────────────┐  ┌──────────────┐                                  │
│  │Ultimate Mode │  │ Review Portal│                                  │
│  │  /ultimate   │  │ /review/[tk] │                                  │
│  └──────────────┘  └──────────────┘                                  │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│  API LAYER (Next.js App Router)                                       │
│  Auth · Credits · Jobs · Vault · Timeline · Audio · Location         │
│  Avatar · Translate · Highlights · Review · Plugin · Webhooks        │
├─────────────────────────────────────────────────────────────────────┤
│  CORE SERVICES                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │  MEDIA ROUTING   │  │  GROWTH ENGINE   │  │  INTELLIGENCE     │  │
│  │  ENGINE          │  │  BRAIN           │  │  FIREWALL         │  │
│  │                  │  │                  │  │                   │  │
│  │ SceneDecomposer  │  │  Model 1 (Brain) │  │  4 Domain DBs     │  │
│  │ MultiSegment     │  │  Model 2 (Pixel) │  │  Probe Battery    │  │
│  │ Blender          │  │  Council         │  │  Update Watcher   │  │
│  │ QualityGate      │  │  Agentic Loop    │  │  Cheap Crew       │  │
│  └──────────────────┘  └──────────────────┘  └───────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│  PROCESSING LAYER                                                     │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ fal.ai  │  │ BullMQ   │  │ FFmpeg   │  │  Video Model Farm    │ │
│  │ Gateway │  │ Queue    │  │ Render   │  │  Kling·Veo·Seedance  │ │
│  │         │  │          │  │ Engine   │  │  Wan·HunyuanVideo    │ │
│  └─────────┘  └──────────┘  └──────────┘  │  Luma·Runway·Pika    │ │
│                                            │  Minimax·LTX·SVR     │ │
│                                            └──────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                           │
│  ┌──────────────┐  ┌────────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ PostgreSQL   │  │   Redis    │  │  DAS     │  │ Cloudflare R2 │ │
│  │ (4 domains)  │  │ (4 ns)     │  │ Storage  │  │ CDN           │ │
│  └──────────────┘  └────────────┘  └──────────┘  └───────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  ISOLATED TRAINING CLUSTER (Separate Machine — DAS Rig)              │
│  Data Pipeline · Distillation · DPO Training · Quality Gate          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. TECHNOLOGY STACK

### Core Framework Dependencies
| Package | Version | Purpose | Required By |
|---|---|---|---|
| next | 15.x | Full-stack framework | Everything |
| typescript | 5.x | Type safety | Everything |
| tailwindcss | 4.x | Styling | All UI |
| @shadcn/ui | latest | Component library | All UI |
| zustand | 4.x | Client state | Editor, Vault, Jobs |
| @tanstack/react-query | 5.x | Server state | All data fetching |
| framer-motion | 11.x | Animations | UI transitions |

### Backend & Infrastructure
| Package | Version | Purpose | Required By |
|---|---|---|---|
| prisma | 5.x | ORM | All DB access |
| @prisma/client | 5.x | DB client | All services |
| ioredis | 5.x | Redis client | Queues, sessions, pub/sub |
| bullmq | 5.x | Job queues | Render, training, export |
| next-auth | 5.x (beta) | Authentication | All protected routes |
| bcryptjs | 2.x | Password hashing | Auth credentials |
| zod | 3.x | Schema validation | All API routes |
| socket.io | 4.x | Real-time collab | Ultimate mode |

### Payment & Commerce
| Package | Version | Purpose | Required By |
|---|---|---|---|
| stripe | 14.x | Card payments + subscriptions | Pricing, credits |
| @stripe/stripe-js | 3.x | Client-side Stripe | Checkout UI |
| @paypal/checkout-server-sdk | 2.x | PayPal payments | Pricing, credits |

### AI & Model APIs
| Package | Version | Purpose | Required By |
|---|---|---|---|
| @fal-ai/client | latest | Unified AI processing | Lighting, upscale, face, depth |
| @anthropic-ai/sdk | latest | Council + product AI | Routing, content gen |
| @google-cloud/vertexai | latest | Veo 3 | Film tier generation |
| node-cron | 3.x | Scheduled intelligence | Update watcher |

### Media Processing
| Package | Version | Purpose | Required By |
|---|---|---|---|
| fluent-ffmpeg | 2.x | Server-side video ops | Render, export, stabilise |
| @ffmpeg/ffmpeg | 0.12.x | Browser WASM preview | Timeline scrubbing |
| sharp | 0.33.x | Image processing | Thumbnails, upscale prep |
| @remotion/bundler | 4.x | Programmatic video | Motion graphics |
| @remotion/renderer | 4.x | Remotion render | Templates |
| music-metadata | 9.x | Audio analysis | Beat detection |

### Storage & CDN
| Package | Version | Purpose | Required By |
|---|---|---|---|
| @aws-sdk/client-s3 | 3.x | R2 S3-compatible | All media storage |
| @aws-sdk/s3-request-presigner | 3.x | Signed URLs | Secure delivery |
| multer | 1.x | File upload handling | Vault, assets |

### UI & Interaction
| Package | Version | Purpose | Required By |
|---|---|---|---|
| @use-gesture/react | 10.x | Drag gestures | Timeline |
| lucide-react | 0.383.x | Icons | All UI |
| clsx | 2.x | Class utilities | All components |
| tailwind-merge | 2.x | Class merging | All components |
| class-variance-authority | 0.7.x | Component variants | UI system |

### Testing
| Package | Version | Purpose | Required By |
|---|---|---|---|
| jest | 29.x | Unit tests | All services |
| @testing-library/react | 14.x | Component tests | All UI |
| playwright | 1.x | E2E tests | Critical flows |

### Install Command
```bash
npx create-next-app@latest cinematic-forge --typescript --tailwind --app --src-dir
cd cinematic-forge
npm install zustand @tanstack/react-query @tanstack/react-query-devtools
npm install prisma @prisma/client next-auth@beta bcryptjs
npm install -D @types/bcryptjs
npm install ioredis bullmq node-cron
npm install stripe @stripe/stripe-js @paypal/checkout-server-sdk
npm install @fal-ai/client @anthropic-ai/sdk @google-cloud/vertexai
npm install fluent-ffmpeg @ffmpeg/ffmpeg @ffmpeg/core sharp music-metadata
npm install @remotion/bundler @remotion/renderer remotion
npm install -D @types/fluent-ffmpeg
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install socket.io socket.io-client
npm install zod nanoid date-fns axios form-data multer
npm install -D @types/multer
npm install @use-gesture/react framer-motion
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install -D jest @testing-library/react @testing-library/jest-dom playwright
```

---

## 4. DATABASE ARCHITECTURE

### Four Isolated Domains (Knowledge Firewall)

**DB_PRODUCT** — Main application database (users, projects, jobs, vault)  
**DB_TECHNICAL** — Routing decisions, model performance logs  
**DB_INTELLIGENCE** — Probe results, model reports, competitive data  
**DB_MARKETING** — Marketing AI context only (minimal schema)

### DB_PRODUCT — Complete Schema Summary

| Model | Purpose | Key Relations |
|---|---|---|
| User | Account, role, credits | Projects, RenderJobs, Vault |
| Account | OAuth accounts | User |
| Session | Auth sessions | User |
| Project | Editor project | User, RenderJobs, Vault |
| VaultCharacter | Character profiles + LoRA | Project |
| VaultLocation | Location data + HDRI | Project |
| RenderJob | All generation/processing jobs | User, Project |
| CreditTransaction | Credit history | User |
| TrainingData | RLHF + repaint delta | User |
| RLHFLog | Preference signal | User |
| ApiUsageLog | External API cost tracking | — |
| Avatar | AI avatar profiles | User |
| ReviewLink | Client review links | Project |
| ReviewComment | Frame-accurate comments | ReviewLink |
| BrandKit | Brand assets + settings | User |

### DB_TECHNICAL Schema Summary

| Model | Purpose |
|---|---|
| RoutingDecision | scene→model→quality score history |
| ModelPerformanceLog | per-model latency + quality |
| SeamlessBlendLog | cross-model stitch quality |

### DB_INTELLIGENCE Schema Summary

| Model | Purpose |
|---|---|
| ProbeResult | 120-probe battery outputs |
| ModelReport | Competitive analysis reports |
| ModelUpdate | Version change detections |
| TrainingSignal | Extracted training data from probes |

---

## 5. ENVIRONMENT VARIABLES — COMPLETE INDEX

```env
# ═══════════════════════════════════════════════
# APPLICATION
# ═══════════════════════════════════════════════
NEXT_PUBLIC_APP_URL="https://cinematicforge.ai"
NEXT_PUBLIC_APP_NAME="Cinematic Forge"
NEXT_PUBLIC_BRAND="INNOVATIVE"
NODE_ENV="production"

# ═══════════════════════════════════════════════
# DATABASES (4 isolated domains)
# ═══════════════════════════════════════════════
DB_PRODUCT="postgresql://user:pass@host:5432/cinema_product"
DB_TECHNICAL="postgresql://user:pass@host:5432/cinema_technical"
DB_INTELLIGENCE="postgresql://user:pass@host:5432/cinema_intelligence"
DB_MARKETING="postgresql://user:pass@host:5432/cinema_marketing"
# Legacy alias (points to DB_PRODUCT)
DATABASE_URL="${DB_PRODUCT}"

# ═══════════════════════════════════════════════
# REDIS (4 isolated namespaces)
# ═══════════════════════════════════════════════
REDIS_PRODUCT="redis://localhost:6379/0"
REDIS_TECHNICAL="redis://localhost:6379/1"
REDIS_INTELLIGENCE="redis://localhost:6379/2"
REDIS_MARKETING="redis://localhost:6379/3"
# Legacy alias
REDIS_URL="${REDIS_PRODUCT}"

# ═══════════════════════════════════════════════
# AUTHENTICATION
# ═══════════════════════════════════════════════
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://cinematicforge.ai"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ═══════════════════════════════════════════════
# PAYMENTS
# ═══════════════════════════════════════════════
# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
# Stripe Price IDs
STRIPE_PRICE_PRO_MONTHLY="price_..."
STRIPE_PRICE_PRO_YEARLY="price_..."
STRIPE_PRICE_STUDIO_MONTHLY="price_..."
STRIPE_PRICE_STUDIO_YEARLY="price_..."
STRIPE_PRICE_ULTIMATE_MONTHLY="price_..."
STRIPE_PRICE_ULTIMATE_YEARLY="price_..."
STRIPE_PRICE_CREDITS_100="price_..."
STRIPE_PRICE_CREDITS_500="price_..."
STRIPE_PRICE_CREDITS_2000="price_..."
STRIPE_PRICE_CREDITS_10000="price_..."
# PayPal
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
PAYPAL_MODE="live"  # sandbox | live
NEXT_PUBLIC_PAYPAL_CLIENT_ID=""

# ═══════════════════════════════════════════════
# AI — DOMAIN-SEPARATED API KEYS
# ═══════════════════════════════════════════════
MARKETING_AI_KEY=""    # Claude Haiku — marketing copy only
PRODUCT_AI_KEY=""      # Claude Sonnet — user-facing features
TECHNICAL_AI_KEY=""    # Model 1 local endpoint key
INTELLIGENCE_AI_KEY="" # Claude Haiku — analysis reports

# Council (fallback + distillation)
ANTHROPIC_API_KEY=""   # Shared fallback
DEEPSEEK_API_KEY=""
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"

# ═══════════════════════════════════════════════
# GROWTH ENGINE — MODEL 1 & 2
# ═══════════════════════════════════════════════
MODEL1_ENDPOINT="http://192.168.1.100:8000/v1"
MODEL1_NAME="meta-llama/Llama-4-Scout-17B-16E-Instruct"
MODEL1_API_KEY="local"
MODEL1_FALLBACK_ENDPOINT="https://api.replicate.com/v1"
REPLICATE_API_TOKEN=""
MODEL2_ENDPOINT="http://192.168.1.100:8001"
MODEL2_NAME="genmo/mochi-1-preview"
MODEL2_FAL_FALLBACK="fal-ai/mochi-v1"

# ═══════════════════════════════════════════════
# VIDEO MODEL APIs
# ═══════════════════════════════════════════════
FAL_KEY=""
KLING_API_KEY=""
KLING_API_SECRET=""
SEEDANCE_API_KEY=""
LUMA_API_KEY=""
RUNWAY_API_KEY=""
PIKA_API_KEY=""
MINIMAX_API_KEY=""
HUNYUAN_API_KEY=""
LTX_API_KEY=""
PIXVERSE_API_KEY=""
SKYREELS_API_KEY=""
GOOGLE_PROJECT_ID=""
GOOGLE_LOCATION="us-central1"
GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"

# ═══════════════════════════════════════════════
# AUDIO APIs
# ═══════════════════════════════════════════════
SUNO_SESSION_ID=""
SUNO_COOKIE=""
ELEVENLABS_API_KEY=""

# ═══════════════════════════════════════════════
# LOCATION APIs
# ═══════════════════════════════════════════════
MAPILLARY_ACCESS_TOKEN=""
CESIUM_ION_ACCESS_TOKEN=""

# ═══════════════════════════════════════════════
# STORAGE
# ═══════════════════════════════════════════════
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="cinematicforge-media"
R2_PUBLIC_URL="https://media.cinematicforge.ai"
DAS_BASE_PATH="/mnt/das/cinema"
DAS_TRAINING_PATH="/mnt/das/cinema/training"
DAS_INTELLIGENCE_PATH="/mnt/das/cinema/intelligence"

# ═══════════════════════════════════════════════
# TRAINING CLUSTER
# ═══════════════════════════════════════════════
TRAINING_CLUSTER_HOST="192.168.1.101"
TRAINING_CLUSTER_API_KEY=""
TRAINING_DATA_SYNC_INTERVAL="3600"

# ═══════════════════════════════════════════════
# FEATURE FLAGS
# ═══════════════════════════════════════════════
NSFW_CHECK_ENABLED="true"
COUNCIL_CALL_LOG_ENABLED="true"
INTELLIGENCE_FIREWALL_ENABLED="true"

# ═══════════════════════════════════════════════
# DEV ACCOUNT (seed only — never in production secrets)
# ═══════════════════════════════════════════════
DEV_ACCOUNT_EMAIL="innovative.trailers@gmail.com"
DEV_ACCOUNT_UNLIMITED="true"
```

---

## 6. FEATURE INDEX — ALL 106 FEATURES

### A. Core Editing (13 features)
| # | Feature | Mode | Depends On |
|---|---|---|---|
| A01 | Multi-track timeline | Advanced+ | FFmpeg, Zustand editor store |
| A02 | Drag-and-drop clips | Advanced+ | @use-gesture/react |
| A03 | Trim handles | Advanced+ | Timeline schema |
| A04 | Ripple edit | Advanced+ | Timeline store |
| A05 | Repaint (highlight + re-generate) | Advanced+ | MediaRouter, BullMQ |
| A06 | Optical flow retiming / slow-mo | Advanced+ | fal-ai/film-interpolation |
| A07 | Video stabilisation | Advanced+ | FFmpeg vidstab |
| A08 | Morph Cut (dialogue takes) | Advanced+ | fal.ai FILM |
| A09 | Transcript-based editing | Advanced+ | Whisper (fal.ai) |
| A10 | AI filler word removal | Advanced+ | Whisper |
| A11 | Silence removal | Advanced+ | FFmpeg silencedetect |
| A12 | Auto Reframe | Advanced+ | YOLO object detection |
| A13 | Clip Extend (generative) | Advanced+ | I2V models, MediaRouter |

### B. Colour Science (12 features)
| # | Feature | Mode | Depends On |
|---|---|---|---|
| B01 | ASC CDL wheels (Lift/Gamma/Gain) | Ultimate | FFmpeg colorgrade |
| B02 | LUT import (.cube) | Ultimate | FFmpeg lut3d |
| B03 | Film emulation presets | Ultimate | .cube LUT files |
| B04 | HDR / Rec.2020 support | Ultimate | FFmpeg, OCIO |
| B05 | Waveform + Vectorscope | Ultimate | Canvas rendering |
| B06 | OpenColorIO (ACES 2.0) | Ultimate | OCIO config bundle |
| B07 | RAW camera ingestion | Ultimate | FFmpeg + libraw |
| B08 | Timeline harmonisation | Advanced+ | fal.ai img2img |
| B09 | IC-Light relighting | Advanced+ | fal-ai/ic-light |
| B10 | Location plate lighting match | Advanced+ | IC-Light + Mapillary |
| B11 | Film grain preservation | Advanced+ | FFT analysis + FFmpeg geq |
| B12 | Collaborative grade session | Ultimate | socket.io |

### C. AI Generation (8 features)
| # | Feature | Mode | Depends On |
|---|---|---|---|
| C01 | Text-to-video | Simple+ | MediaRouter, all VLMs |
| C02 | Image-to-video | Simple+ | MediaRouter, I2V VLMs |
| C03 | Audio-to-video | Simple+ | beat detection, VLMs |
| C04 | Multi-segment omnichannel clip | Advanced+ | SceneDecomposer, all VLMs |
| C05 | Auto-Social (Drop & Direct) | Simple+ | Claude Vision, Suno, beats |
| C06 | AI Director full film assembly | Ultimate | Model 1, VaultSystem, all VLMs |
| C07 | Storyboard from script | Ultimate | Claude Sonnet, Flux Pro |
| C08 | Reference video analysis | Advanced+ | Model 1 Vision |

### D. VFX Compositing (15 features)
| # | Feature | Mode | Depends On |
|---|---|---|---|
| D01 | Layer-based compositor | Advanced+ | Canvas, blend modes |
| D02 | Node-based compositor (Fusion-class) | Ultimate | React canvas, FFmpeg filtergraph |
| D03 | Chroma key / Green screen | Advanced+ | FFmpeg chromakey + BiRefNet |
| D04 | AI matting (no green screen) | Advanced+ | fal-ai/birefnet |
| D05 | Depth matting | Advanced+ | Depth Anything V2 |
| D06 | Planar / surface tracker | Advanced+ | fal-ai/cotracker |
| D07 | Motion Brush (region-level motion) | Advanced+ | ControlNet, Kling motion API |
| D08 | GPU particle system | Ultimate | Three.js InstancedMesh |
| D09 | SFX asset library (weather, fire, etc.) | Advanced+ | Pre-rendered assets R2 |
| D10 | AI-generated custom VFX | Advanced+ | fal.ai img2img |
| D11 | CGI insertion (text-to-3D composite) | Ultimate | fal-ai/triposg, Depth Anything |
| D12 | Luminance / luma keyer | Advanced+ | FFmpeg chromakey |
| D13 | Mask tools (bezier, freehand) | Advanced+ | Canvas SVG |
| D14 | Blend mode library | Advanced+ | FFmpeg overlay filters |
| D15 | Spatial computing export | Ultimate | Depth maps → .mvhevc |

### E. 3D / CGI (10 features)
| # | Feature | Mode | Depends On |
|---|---|---|---|
| E01 | Text prompt → 3D asset | Ultimate | fal-ai/triposg |
| E02 | Depth-aware compositing | Ultimate | Depth Anything V2 |
| E03 | Scene lighting estimation | Ultimate | VLM frame analysis + IC-Light |
| E04 | Perspective-matched insertion | Ultimate | FFmpeg perspective filter |
| E05 | Motion graphics templates (200+) | Advanced+ | Remotion compositions |
| E06 | AI-generated MoGRT on demand | Advanced+ | Model 1 + Remotion |
| E07 | Text overlay (3D extruded) | Advanced+ | Three.js Text3D |
| E08 | Particle behaviours (gravity, wind) | Ultimate | Three.js InstancedMesh |
| E09 | Diffusion physics for VFX | Ultimate | VLM + physics-trained VFX |
| E10 | USD scene export | Ultimate | Three.js → USD exporter |

### F. Audio Production (16 features)
| # | Feature | Mode | Depends On |
|---|---|---|---|
| F01 | Multi-track audio mixer | Advanced+ | Zustand audio store |
| F02 | Per-track volume + pan | Advanced+ | FFmpeg |
| F03 | 6-band parametric EQ | Ultimate | FFmpeg equalizer |
| F04 | Compressor / Gate / Limiter | Ultimate | FFmpeg acompressor |
| F05 | Reverb + Delay inserts | Ultimate | FFmpeg areverb |
| F06 | De-esser | Ultimate | FFmpeg |
| F07 | Dolby Atmos spatial audio | Ultimate | FFmpeg spatial metadata |
| F08 | AI IntelliCut (silence removal) | Advanced+ | Whisper + FFmpeg |
| F09 | Speaker separation | Advanced+ | fal.ai audio models |
| F10 | AI Dialogue Matcher | Ultimate | EQ profile matching |
| F11 | ADR loop recorder | Ultimate | Web Audio API |
| F12 | Foley recorder | Ultimate | Web Audio API + sync |
| F13 | Stem export buses | Ultimate | FFmpeg mixdown |
| F14 | Music generation (Suno) | Simple+ | Suno API |
| F15 | Voice synthesis + cloning (ElevenLabs) | Advanced+ | ElevenLabs API |
| F16 | Foley / ambient sound (AudioCraft) | Advanced+ | fal.ai stable-audio |

### G. Character / Performance (6 features)
| # | Feature | Mode | Depends On |
|---|---|---|---|
| G01 | Character vault (multi-image register) | Advanced+ | fal-ai/face-id, Prisma |
| G02 | LoRA auto-training (10-scene trigger) | Advanced+ | fal-ai/flux-lora-training |
| G03 | Model lock (character consistency) | Advanced+ | VaultCharacter.modelFamily |
| G04 | SFX makeup system (wounds, dirt, etc.) | Advanced+ | img2img, Stable-Makeup |
| G05 | Character recasting (face/body/project) | Advanced+ | fal-ai/face-swap, DWPose |
| G06 | Act-Two performance capture | Advanced+ | DWPose, LivePortrait, Kling |

### H. Social / Content (5 features)
| # | Feature | Mode | Depends On |
|---|---|---|---|
| H01 | Auto-Social 30-asset editor | Simple+ | Claude Vision, beats, Suno |
| H02 | Smart highlight extraction | Simple+ | Whisper, Model 1 scoring |
| H03 | Direct social publishing | Simple+ | TikTok/IG/YouTube APIs |
| H04 | Platform auto-reframe | Simple+ | YOLO tracking, FFmpeg crop |
| H05 | Brand kit auto-apply | Advanced+ | BrandKit Prisma model |

### I. Location / World (5 features)
| # | Feature | Mode | Depends On |
|---|---|---|---|
| I01 | Mapillary real-world location search | Advanced+ | Mapillary API v4 |
| I02 | Cesium aerial path builder | Advanced+ | Cesium Ion API |
| I03 | OSM generative prompt builder | Advanced+ | Nominatim + Claude |
| I04 | Location plate lighting extraction | Advanced+ | IC-Light + Mapillary |
| I05 | Production Scout mode | Ultimate | I01 + I02 + I04 |

### J. AI Production (5 features)
| # | Feature | Mode | Depends On |
|---|---|---|---|
| J01 | AI Director (script → full film) | Ultimate | Model 1, MCTS, all VLMs |
| J02 | Continuity checker | Ultimate | Claude Vision |
| J03 | Multi-camera editor | Ultimate | Timecode sync, YOLO |
| J04 | Series bible generator | Ultimate | Model 1 |
| J05 | Film mode (feature film pipeline) | Ultimate | Fountain parser, J01 |

### K. Export / Delivery (6 features)
| # | Feature | Mode | Depends On |
|---|---|---|---|
| K01 | Social export (MP4 H.264, platform presets) | Simple+ | FFmpeg |
| K02 | Professional export (ProRes 422/4444) | Advanced+ | FFmpeg ProRes codec |
| K03 | DCP (Digital Cinema Package) | Ultimate | Python IMF service |
| K04 | IMF package for streaming platforms | Ultimate | Python IMF + MXF |
| K05 | C2PA provenance metadata injection | All | FFmpeg -metadata |
| K06 | OCIO-correct export | Ultimate | OpenColorIO |

### L. Plugin / Scripting (1 feature)
| # | Feature | Mode | Depends On |
|---|---|---|---|
| L01 | Node.js REST plugin API + npm SDK | Ultimate | NextAuth, Studio tier |

### M. Upscaling (complete system)
| # | Feature | Mode | Depends On |
|---|---|---|---|
| M01 | Per-clip upscale (2x/4x/8x) | Advanced+ | fal.ai engines |
| M02 | Export-time upscale | All | M01 + export pipeline |
| M03 | Batch project upscale | Advanced+ | BullMQ, M01 |
| M04 | Vault auto-upscale (char references) | Advanced+ | AuraSR |
| M05 | Face enhancement (CodeFormer) | Advanced+ | fal-ai/codeformer |
| M06 | Film grain preservation | Advanced+ | FFT + FFmpeg geq |

### N. Avatar System
| # | Feature | Mode | Depends On |
|---|---|---|---|
| N01 | Instant avatar (webcam) | Simple+ | ElevenLabs, SadTalker |
| N02 | Stock avatar library (30+) | Simple+ | Pre-generated vault |
| N03 | Script-to-avatar-video | Simple+ | ElevenLabs, SadTalker |
| N04 | Talking photo | Simple+ | fal-ai/sadtalker |

### O. Distribution & Review
| # | Feature | Mode | Depends On |
|---|---|---|---|
| O01 | Client review portal | Advanced+ | ReviewLink Prisma model |
| O02 | Frame-accurate annotations | Advanced+ | Canvas SVG overlay |
| O03 | Approval workflow | Advanced+ | ReviewLink.status |
| O04 | Video translation (29 languages) | Advanced+ | Whisper, ElevenLabs, SadTalker |
| O05 | Overdub (word-level voice patch) | Advanced+ | ElevenLabs, Whisper timestamps |
| O06 | Stock asset library (Pexels+FMA) | All | Pexels API, FMA |

---

## 7. API ENDPOINT INDEX

```
POST   /api/auth/[...nextauth]       Authentication
GET    /api/credits/balance          Current balance
POST   /api/credits/purchase/stripe  Stripe checkout
POST   /api/credits/purchase/paypal  PayPal checkout
POST   /api/jobs/create              Create generation job
GET    /api/jobs/[id]/status         Poll job status
GET    /api/jobs/[id]/stream         SSE progress stream
POST   /api/vault/character/create   Register character
GET    /api/vault/character/list     List characters
GET    /api/vault/character/[id]     Get character
DELETE /api/vault/character/[id]     Delete character
POST   /api/vault/location/search    Search locations
POST   /api/vault/location/cesium-path  Aerial path
GET    /api/timeline/render          Render timeline
POST   /api/timeline/proxy           Generate proxy
POST   /api/timeline/export          Export final
POST   /api/audio/music              Generate music
POST   /api/audio/speech             Generate speech
POST   /api/audio/foley              Generate foley
POST   /api/audio/beats              Detect beats
POST   /api/auto-social              Auto-Social pipeline
POST   /api/location/mapillary       Search Mapillary
POST   /api/location/cesium          Cesium aerial
POST   /api/location/osm             OSM prompt
POST   /api/translate/video          Video translation
POST   /api/highlights/extract       Smart clip extraction
POST   /api/cgi/insert               CGI insertion
POST   /api/upscale/clip             Upscale video clip
POST   /api/upscale/batch            Batch upscale
POST   /api/upscale/image            Upscale image
POST   /api/avatar/create            Create avatar
POST   /api/avatar/generate          Generate avatar video
POST   /api/review/create            Create review link
GET    /api/review/[token]/comments  Get review comments
POST   /api/review/[token]/comment   Add comment
POST   /api/review/[token]/approve   Approve / request changes
POST   /api/moderation/check         NSFW check
GET    /api/plugin/timeline          Plugin: read timeline
POST   /api/plugin/jobs              Plugin: create jobs
POST   /api/webhooks/stripe          Stripe webhook
POST   /api/webhooks/paypal          PayPal webhook
POST   /api/webhooks/fal             fal.ai completion webhook
```

---

## 8. OMNICHANNEL MEDIA ROUTING ENGINE

> **Core principle**: No single VLM generates an entire clip. The SceneDecomposer analyses each clip's requirements and dispatches segments to the specialist engine for that requirement. One clip = up to 5+ different VLMs, seamlessly stitched by the SeamlessBlender.

### Why This Matters
Traditional platforms: user picks one model → that model generates everything  
Cinematic Forge: Brain decomposes requirements → each segment goes to its best engine → impossible to beat quality/cost ratio

### Example: A Single 10-Second Clip
```
Prompt: "Detective enters rainy alley, lights cigarette, looks up at neon sign"

Segment 1 (0s–2s): Wide establishing — alley environment, rain
→ Engine: Veo 3.1 [fluid dynamics + atmosphere specialist]

Segment 2 (2s–5s): Detective walks — human locomotion, coat movement
→ Engine: Kling 3.0 [human biomechanics specialist]

Segment 3 (5s–7s): Close-up — lighting cigarette, hand detail
→ Engine: Seedance 2.0 [character detail + fine motor specialist]

Segment 4 (7s–8.5s): Neon sign "BAR" — text rendering
→ Engine: CogVideoX [text accuracy specialist]

Segment 5 (8.5s–10s): Detective looks up — facial expression, eye contact
→ Engine: SkyReels V1 [emotional acting + portrait specialist]

Post-process: SeamlessBlender normalises colour, grain, and temperature across all 5 segments
Output: One seamless 10-second clip, impossible to produce with any single model
```

### SceneDecomposer Architecture
```typescript
// src/lib/routing/SceneDecomposer.ts

export interface SceneSegment {
  segmentId: string
  clipId: string
  startTime: number           // within the clip
  endTime: number
  requirements: SegmentRequirement[]
  assignedEngine: string      // VLM name — never shown to user
  tier: OutcomeTier
  anchorFrameUrl?: string     // for temporal continuity between segments
  estimatedCredits: number
}

export type SegmentRequirement =
  | 'fluid_dynamics'        // → Veo 3.1
  | 'human_locomotion'      // → Kling 3.0
  | 'character_detail'      // → Seedance 2.0
  | 'text_rendering'        // → CogVideoX
  | 'emotional_acting'      // → SkyReels V1
  | 'wildlife_motion'       // → Wan 2.2
  | 'aerial_landscape'      // → Luma Ray 3
  | 'crowd_dynamics'        // → HunyuanVideo
  | 'atmosphere'            // → Veo 3.1
  | 'cgi_integration'       // → Seedance V2V + CGI pipeline
  | 'cost_efficient'        // → Wan 2.2 or LTX 2.3

export async function decomposeScene(params: {
  prompt: string
  duration: number
  tier: OutcomeTier
  characterIds?: string[]
}): Promise<SceneSegment[]>
// Model 1 reads the full prompt
// Identifies temporal phases within the scene
// Assigns each phase to the optimal engine
// Returns array of segments ready for parallel dispatch
```

### VLM Engine Capability Matrix (Research-Verified)
| Engine | Optimal For | Avoid For | Cost Index |
|---|---|---|---|
| Veo 3.1 | Fluid dynamics, physics, photorealism, native audio | Budget shots | 35 cr/5s |
| Kling 3.0 | Human locomotion, hands, facial consistency, complex motion | Static environments | 25 cr/5s |
| Seedance 2.0 | Character detail, dialogue, fine motor, V2V repair | Large environments | 20 cr/5s |
| SkyReels V1 | Emotional acting, 400+ expressions, portrait | Action sequences | 20 cr/5s |
| Runway Gen-4 | Multi-shot character continuity, commercial grade | Wildlife, nature | 22 cr/5s |
| HunyuanVideo | Crowd scenes, cyberpunk density, multi-person | Character close-ups | 12 cr/5s |
| Luma Ray 3 | Aerial shots, smooth camera motion, environments | Human performance | 8 cr/5s |
| Minimax | Long-form (up to 6min), consistent quality | Premium quality shots | 10 cr/5s |
| CogVideoX | Text rendering, exact prompt adherence, spatial | Human scenes | 6 cr/5s |
| Wan 2.2 | Wildlife, fur/skin texture, budget establishing shots | Complex physics | 2 cr/5s |
| LTX 2.3 | Fast generation, basic quality, text-heavy | Cinematic work | 1 cr/5s |
| Pika 2.5 | Object-level editing, close-ups, element control | Long sequences | 8 cr/5s |

### SeamlessBlender (Cross-Engine Normaliser)
```typescript
// src/lib/routing/SeamlessBlender.ts
// Runs after every multi-engine clip assembly

export interface BlendProfile {
  colorTemperature: number    // Kelvin
  saturation: number          // -1 to 1
  grainFrequency: number      // Hz
  grainIntensity: number      // 0-1
  compressionProfile: string  // detected codec signature
  contrast: number
}

// Known per-engine profiles (research-calibrated)
export const ENGINE_PROFILES: Record<string, BlendProfile> = {
  veo_3_1:      { colorTemperature: 6200, saturation: 0.0, grainFrequency: 120, grainIntensity: 0.02, compressionProfile: 'sharp_neutral', contrast: 0.55 },
  kling_3_0:    { colorTemperature: 5800, saturation: 0.08, grainFrequency: 95, grainIntensity: 0.04, compressionProfile: 'warm_soft', contrast: 0.50 },
  seedance_2_0: { colorTemperature: 5900, saturation: 0.05, grainFrequency: 110, grainIntensity: 0.03, compressionProfile: 'neutral_crisp', contrast: 0.52 },
  wan_2_2:      { colorTemperature: 5500, saturation: -0.05, grainFrequency: 80, grainIntensity: 0.07, compressionProfile: 'cool_grainy', contrast: 0.45 },
}

// House look target — all engines normalised toward this
export const HOUSE_LOOK: BlendProfile = {
  colorTemperature: 5900,
  saturation: 0.02,
  grainFrequency: 100,
  grainIntensity: 0.03,
  compressionProfile: 'cinematic_neutral',
  contrast: 0.52,
}

export async function blendSegments(segments: Array<{
  videoUrl: string
  engineId: string
}>): Promise<{ blendedUrl: string }>
// For each segment: compute delta from engine profile to house look
// Apply FFmpeg filter chain: colorbalance + curves + noise
// At each segment boundary: extract last/first frame → IC-Light match
// Apply 8-frame cross-dissolve at stitch points
// Reassemble with FFmpeg concat + xfade transitions
```

---

## 9. LANDING PAGE & AUTHENTICATION

### Landing Page Spec (`/`)
- **Brand**: "Cinematic Forge" large heading, "by INNOVATIVE" subtitle
- **Hero**: Full-viewport video background (auto-play muted loop — AI-generated showcase)
- **CTA**: Two buttons — "Start Free Trial" (→ signup) and "Sign In" (→ login)
- **Features section**: Three columns — Simple / Advanced / Ultimate mode previews
- **Pricing section**: Pricing cards (see Section 10)
- **Footer**: Links, T&Cs, Privacy Policy

### Login Page (`/login`)
- Google OAuth button (primary — required)
- Email + password field (secondary)
- "Forgot password" link
- Link to signup

### Signup Page (`/signup`)
**Step 1 — Account**:
- Google OAuth (primary — creates and verifies account in one step)
- OR: Name, Email, Password fields
- T&Cs checkbox with link to full terms

**Step 2 — Plan Selection** (new non-Google signups or post-Google):
- Plan cards with monthly/yearly toggle
- PayPal and Stripe payment buttons per card
- "Start Free Trial" option (50 credits, no card)

**Step 3 — Payment Processing**:
- Stripe Checkout or PayPal checkout flow
- On `payment_intent.succeeded` / PayPal `PAYMENT.CAPTURE.COMPLETED`:
  - Create subscription in DB
  - Set UserRole, creditBalance
  - Redirect to `/simple` (first login)
- **Access not granted until payment completes** (or free trial selected)

### Verification Flow
```typescript
// src/lib/auth/verification.ts

export async function verifyAndActivateAccount(params: {
  userId: string
  paymentProvider: 'stripe' | 'paypal' | 'free_trial'
  paymentId: string
  planId: string
}): Promise<void>
// 1. Verify payment with provider API
// 2. Set User.role to plan tier
// 3. Add subscription credits to User.creditBalance
// 4. Set User.subscriptionStatus = 'active'
// 5. Send welcome email
// 6. Redirect to app
```

### Google OAuth Configuration
```typescript
// src/lib/auth.ts
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  // Google accounts are pre-verified — no email verification needed
  // On first OAuth login: redirect to plan selection if no subscription
})
```

---

## 10. PRICING & TOKEN ECONOMY

### Subscription Tiers

| Tier | Monthly | Yearly (2 months free) | Credits/Month | Role |
|---|---|---|---|---|
| Free Trial | $0 | — | 50 (once) | FREE |
| Pro | $19/mo | $190/yr ($15.83/mo) | 500 | PRO |
| Studio | $49/mo | $490/yr ($40.83/mo) | 2,000 | STUDIO |
| Ultimate | $99/mo | $990/yr ($82.50/mo) | 6,000 | ULTIMATE |
| Enterprise | Custom | Custom | Unlimited | ADMIN |

### Credit Top-Up Packs (Stripe + PayPal)
| Pack | Credits | Price | Per-Credit Cost |
|---|---|---|---|
| Starter | 100 | $5 | $0.05 |
| Standard | 500 | $20 | $0.04 |
| Pro Pack | 2,000 | $65 | $0.0325 |
| Studio Pack | 10,000 | $250 | $0.025 |

### Complete Operation Costs (`src/lib/credits.ts`)
```typescript
export const OPERATION_COSTS = {
  // Video generation per 5 seconds
  generate_ltx: 1,
  generate_wan: 2,
  generate_animatediff: 1,
  generate_luma: 8,
  generate_pika: 8,
  generate_minimax: 10,
  generate_cog: 6,
  generate_skyreels: 20,
  generate_kling_standard: 18,
  generate_kling_pro: 25,
  generate_seedance: 20,
  generate_runway: 22,
  generate_veo3: 35,
  // Processing
  relight_iclight: 2,
  upscale_2x: 1,
  upscale_4x: 3,
  upscale_4x_face: 4,
  upscale_8x: 10,
  upscale_clarity: 5,
  face_restore: 2,
  lipsync: 5,
  transcribe: 1,
  remove_bg: 1,
  depth_map: 1,
  proxy_draft: 0,           // always free
  stabilise: 2,
  retime_optical_flow: 3,
  // Character
  lora_training: 60,
  ip_adapter: 1,
  performance_capture: 15,
  // Audio
  music_30s: 5,
  music_120s: 15,
  speech: 3,
  foley: 4,
  voice_clone: 20,
  translation_per_min: 8,
  // 3D / CGI
  cgi_3d_generate: 20,
  cgi_composite: 5,
  // Export
  export_1080p: 8,
  export_4k: 20,
  export_dcp: 40,
  export_imf: 50,
  // Production
  auto_social: 10,
  ai_director: 50,
  storyboard: 15,
  continuity_check: 5,
  highlight_extract: 8,
  // Upscale
  grain_restore: 1,
  face_enhance_video: 2,
  // Omnichannel multi-engine (billed as sum of segments)
  // Each segment billed at its engine rate
}
```

### Tier Feature Gates
```typescript
export const TIER_GATES: Record<UserRole, string[]> = {
  FREE: ['C01', 'C02', 'H01', 'K01'],
  PRO: ['A01-A13', 'B08-B10', 'C01-C05', 'D01-D05', 'F01-F02', 'G01-G03',
        'H01-H05', 'I01-I03', 'K01-K02', 'M01-M04', 'N01-N04', 'O04-O06'],
  STUDIO: ['ALL_PRO', 'B01-B07', 'D06-D12', 'E01-E07', 'F03-F16',
           'G04-G06', 'J01-J05', 'K03-K06', 'L01', 'O01-O03'],
  ULTIMATE: ['ALL_FEATURES'],
  ADMIN: ['ALL_FEATURES_UNLIMITED'],
}
```

### PayPal Integration
```typescript
// src/app/api/credits/purchase/paypal/route.ts
import paypal from '@paypal/checkout-server-sdk'

const environment = process.env.PAYPAL_MODE === 'live'
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!)

export const paypalClient = new paypal.core.PayPalHttpClient(environment)

// POST /api/credits/purchase/paypal — create PayPal order
// POST /api/webhooks/paypal — handle PAYMENT.CAPTURE.COMPLETED
// On success: call addCredits() same as Stripe flow
```

---

## 11. KNOWLEDGE FIREWALL

### Four Domain Architecture
The platform operates four completely isolated knowledge domains enforced at the database, API key, and context window level:

| Domain | What It Knows | What It Cannot See |
|---|---|---|
| Marketing | "Cinematic Forge understands your vision" | Model names, routing logic, costs |
| Product | "Draft / Studio / Blockbuster" tiers | Model names, API costs |
| Technical | Full routing matrix, all VLM names, benchmarks | Marketing copy, user data |
| Intelligence | Probe results, competitive analysis, model updates | Production routing, user data |

### Sanitisation
```typescript
// All marketing AI calls pass through sanitiseForMarketing()
// Strips: all VLM names, benchmark scores, routing decisions, API costs
// User-facing text never contains: "Kling", "Veo", "Seedance", engine names
// UI tier labels: "Quick Draft" | "Standard" | "Cinematic" | "Film Grade"
```

### Intelligence Operations
- **Probe Battery**: 120 prompts × 12 categories, run weekly against all engines
- **Update Watcher**: Every 6 hours, checks all engine version endpoints
- **Cheap Crew**: Claude Haiku writes all analysis (cost: ~$50-200/month)
- **Training Signal Extraction**: High-quality probe outputs feed training cluster

---

## 12. GROWTH ENGINE BRAIN

### Two-Model Architecture
- **Model 1 (Brain)**: Llama 4 Scout Vision MoE — reasoning, routing, art direction, JSON payload writing
- **Model 2 (Muscle)**: Mochi 1 / SVD — pure pixel generation, zero reasoning
- **Council**: Claude Sonnet / DeepSeek — hard fallback + distillation source only

### Agentic Loop (Plan → Critique → Revise)
- Max 3 iterations
- Quality threshold: 0.75 to accept
- Chain-of-thought captured to TrainingData on every run

### Data Flywheel (7 capture points)
1. Repaint delta (highest value — supervised video editing pairs)
2. Generation preference (DPO pairs)
3. Prompt refinement (quality improvement)
4. Lighting preference (IC-Light adjustments)
5. Character consistency (multi-scene vault pairs)
6. Routing feedback (implicit model rejection)
7. Auto-Social acceptance

### Isolated Training Cluster
- Separate machine (DAS rig GPU partition)
- Never receives live traffic
- Quality gate before any weight push to production
- Canary deploy: 1% → 10% → 50% → 100%

---

## 13. SPRINT PLAN — INDEXED WITH DEPENDENCIES

### Foundation Sprints (No Dependencies)

**Sprint 1 — Scaffold & Database**
- Dependencies: Node.js 20+, PostgreSQL, Redis
- Deliverables: Next.js project, all 4 Prisma schemas, db/redis singletons
- Blocks: All subsequent sprints

**Sprint 2 — Auth & Landing Page**
- Dependencies: Sprint 1, Google OAuth credentials, Stripe + PayPal accounts
- Deliverables: NextAuth config, landing page, login/signup pages, T&Cs, payment flows
- Blocks: Sprint 3+

**Sprint 3 — Credits, Pricing & Dev Account**
- Dependencies: Sprint 2, Stripe price IDs, PayPal product IDs
- Deliverables: Full OPERATION_COSTS, tier gates, Stripe checkout, PayPal checkout, dev account seed
- Dev account: `innovative.trailers@gmail.com` seeded with ADMIN role + unlimited credits
- Blocks: Sprint 4+

**Sprint 4 — Job Queue & SSE**
- Dependencies: Sprint 1, Redis running
- Deliverables: BullMQ queues (render/training/export), SSE streaming, DAS pull worker
- Blocks: Sprint 5+

**Sprint 5 — fal.ai Processing Layer**
- Dependencies: Sprint 1, FAL_KEY
- Deliverables: IC-Light, AuraSR, Depth Anything, SadTalker, Whisper, REMBG, Flux proxy
- Blocks: Sprint 7+

**Sprint 6 — SceneDecomposer & MediaRouter**
- Dependencies: Sprint 1, Sprint 4
- Deliverables: SceneDecomposer.ts, MediaRouter.ts (replaces old router.ts), SwarmDispatcher.ts, SeamlessBlender.ts
- NOTE: No function, file, or variable names contain the word "agent" — use: Engine, Processor, Handler, Dispatcher, Router, Crew
- Blocks: Sprint 7+

**Sprint 7 — Video Engine Farm**
- Dependencies: Sprint 4, Sprint 6, all VLM API keys
- Deliverables: All VLM clients (Kling, Veo3, Seedance, Luma, Runway, Pika, Minimax, HunyuanVideo, Wan, CogVideoX, LTX, SkyReels)
- Blocks: Sprint 9+

**Sprint 8 — Timeline Engine**
- Dependencies: Sprint 1, FFmpeg installed
- Deliverables: TimelineRecipe schema, FFmpeg renderer, proxy system, harmonise pass
- Blocks: Sprint 10+

**Sprint 9 — Character Vault**
- Dependencies: Sprint 5, Sprint 7
- Deliverables: VaultCharacter CRUD, face embedding, LoRA trigger, model lock, IP-Adapter
- Blocks: Sprint 11+

**Sprint 10 — Location Engine**
- Dependencies: Sprint 1, Mapillary + Cesium keys
- Deliverables: Mapillary search, Cesium aerial, OSM prompt builder, spline interpolation
- Blocks: Sprint 12+

**Sprint 11 — Audio Pipeline**
- Dependencies: Sprint 1, ElevenLabs + Suno keys
- Deliverables: Suno music, ElevenLabs speech + clone, AudioCraft foley, FFT beat detection
- Blocks: Sprint 13+

**Sprint 12 — Auto-Social**
- Dependencies: Sprint 5, Sprint 11, Sprint 8
- Deliverables: Drop & Direct endpoint, Claude Vision edit list, beat-matched recipe
- Blocks: —

**Sprint 13 — Simple Mode UI**
- Dependencies: Sprints 3–12
- Deliverables: Text-to-video, Image-to-video, Audio-to-video, Auto-Social tabs, SSE progress
- Token balance bar visible on all pages

**Sprint 14 — Advanced Mode UI**
- Dependencies: Sprints 8–13
- Deliverables: Full timeline, preview, GeneratePanel, VaultPanel, PropertiesPanel, RepaintModal
- All sidebar icons wired to panels via Zustand activePanel state
- All toolbar buttons wired to tool state with keyboard shortcuts

**Sprint 15 — Ultimate Mode UI**
- Dependencies: Sprint 14
- Deliverables: Colour grading, audio mixer, VFX compositor, CGI insertion, AI Director, storyboard, continuity checker

**Sprint 16 — Upscaling Pipeline**
- Dependencies: Sprint 5, Sprint 8
- Deliverables: All 6 upscale engines, face enhancement, grain restoration, export-time upscale

**Sprint 17 — Knowledge Firewall**
- Dependencies: Sprint 1, Sprint 6
- Deliverables: 4 domain databases, domain-separated Redis, sanitiseForMarketing(), domain API keys

**Sprint 18 — Intelligence Layer**
- Dependencies: Sprint 17
- Deliverables: Probe Battery, ModelIntelligenceAnalyser, UpdateWatcher, intelligence cron

**Sprint 19 — Growth Engine Brain**
- Dependencies: Sprint 7, Sprint 17, local GPU server
- Deliverables: Model 1 vLLM server, runModel1(), Agentic Loop, MCTS for film direction

**Sprint 20 — Training Cluster**
- Dependencies: Sprint 4, Sprint 19, DAS rig second partition
- Deliverables: Data pipeline worker, distillation, RLAIF, quality gate, canary deploy

**Sprint 21 — Omnichannel Multi-Segment Clips**
- Dependencies: Sprint 6, Sprint 7, Sprint 8
- Deliverables: SceneDecomposer (multi-segment), parallel VLM dispatch, SeamlessBlender, single-clip 5-engine pipeline

**Sprint 22 — Avatar System**
- Dependencies: Sprint 5, Sprint 11, Sprint 9
- Deliverables: InstantAvatar, stock avatar library, script-to-video, Talking Photo

**Sprint 23 — Performance Capture**
- Dependencies: Sprint 9, Sprint 5, Sprint 7
- Deliverables: DWPose integration, webcam recorder, LivePortrait expression transfer

**Sprint 24 — Transcript Editing & Audio AI**
- Dependencies: Sprint 5, Sprint 11, Sprint 14
- Deliverables: TranscriptEditor, word-level timeline editing, FillerRemover, StudioSound, Overdub

**Sprint 25 — Client Review Portal**
- Dependencies: Sprint 1, Sprint 8
- Deliverables: ReviewLink + ReviewComment schema, public review page, canvas annotations, approval workflow

**Sprint 26 — Distribution**
- Dependencies: Sprint 8, Sprint 11, Sprint 5
- Deliverables: Video translation (29 languages), smart highlight extraction, social publishing APIs

**Sprint 27 — Brand Kit & Stock Library**
- Dependencies: Sprint 1, Sprint 8
- Deliverables: BrandKit schema + auto-apply, Pexels + FMA integration, SFX library

**Sprint 28 — Hollywood Pipeline**
- Dependencies: Sprint 8, Sprint 15
- Deliverables: AAF/OTIO interchange, Pro Tools stem export, IMF packaging, ShotGrid integration, Fairlight-class audio DAW

**Sprint 29 — Security & Hardening**
- Dependencies: All sprints
- Deliverables: NSFW moderation, rate limiting, C2PA injection, security audit, all tests

**Sprint 30 — Plugin API**
- Dependencies: Sprint 2, Sprint 7, Sprint 8
- Deliverables: REST plugin API, npm SDK publish

---

## 14. FILE STRUCTURE — COMPLETE INDEX

```
src/
├── app/
│   ├── page.tsx                          # Landing page (Cinematic Forge by INNOVATIVE)
│   ├── (auth)/
│   │   ├── login/page.tsx                # Login with Google + credentials
│   │   └── signup/page.tsx               # Multi-step signup + payment
│   ├── (editor)/
│   │   ├── layout.tsx                    # Editor shell — TopNav + TokenBar
│   │   ├── simple/page.tsx
│   │   ├── advanced/page.tsx
│   │   └── ultimate/page.tsx
│   ├── review/[token]/page.tsx           # Public client review portal
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── credits/
│       │   ├── balance/route.ts
│       │   ├── purchase/stripe/route.ts
│       │   └── purchase/paypal/route.ts
│       ├── jobs/
│       │   ├── create/route.ts
│       │   ├── [jobId]/status/route.ts
│       │   └── [jobId]/stream/route.ts   # SSE
│       ├── vault/...
│       ├── timeline/...
│       ├── audio/...
│       ├── location/...
│       ├── upscale/...
│       ├── avatar/...
│       ├── review/...
│       ├── translate/video/route.ts
│       ├── highlights/extract/route.ts
│       ├── auto-social/route.ts
│       ├── cgi/insert/route.ts
│       ├── plugin/...
│       ├── moderation/check/route.ts
│       └── webhooks/
│           ├── stripe/route.ts
│           ├── paypal/route.ts
│           └── fal/route.ts
│
├── components/
│   ├── landing/
│   │   ├── HeroSection.tsx
│   │   ├── FeatureSection.tsx
│   │   ├── PricingSection.tsx
│   │   └── Footer.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   ├── PlanSelector.tsx              # Monthly/yearly toggle + plan cards
│   │   └── PaymentOptions.tsx           # Stripe + PayPal buttons
│   ├── layout/
│   │   ├── TopNav.tsx
│   │   ├── TokenBar.tsx                  # Always visible token balance + purchase
│   │   └── ModeSwitcher.tsx
│   ├── editor/
│   │   ├── Timeline.tsx
│   │   ├── TrackRow.tsx
│   │   ├── Clip.tsx
│   │   ├── Playhead.tsx
│   │   ├── TimeRuler.tsx
│   │   ├── Preview.tsx
│   │   ├── MotionBrush.tsx
│   │   └── TranscriptEditor.tsx
│   ├── panels/
│   │   ├── GeneratePanel.tsx
│   │   ├── VaultPanel.tsx
│   │   ├── LocationPanel.tsx
│   │   ├── LibraryPanel.tsx
│   │   ├── TransitionsPanel.tsx
│   │   ├── PropertiesPanel.tsx
│   │   ├── RepaintModal.tsx
│   │   ├── UpscalePanel.tsx
│   │   └── AudioMixPanel.tsx
│   ├── studio/
│   │   ├── ColorGrading.tsx
│   │   ├── AudioMixer.tsx
│   │   ├── VFXCompositor.tsx
│   │   ├── NodeCompositor.tsx
│   │   ├── CGIInsertion.tsx
│   │   ├── AIDirectorPanel.tsx
│   │   ├── StoryboardPanel.tsx
│   │   ├── ContinuityPanel.tsx
│   │   ├── ParticleEngine.tsx
│   │   └── SpatialExport.tsx
│   ├── simple/
│   │   ├── PromptInput.tsx
│   │   ├── TierSelector.tsx              # "Quick Draft / Standard / Cinematic / Film Grade"
│   │   ├── GenerationProgress.tsx
│   │   ├── GenerationGallery.tsx
│   │   └── AutoSocialDrop.tsx
│   └── avatar/
│       ├── AvatarCreator.tsx
│       ├── AvatarGallery.tsx
│       └── TalkingPhotoPanel.tsx
│
├── lib/
│   ├── routing/
│   │   ├── SceneDecomposer.ts            # Multi-segment scene analysis
│   │   ├── MediaRouter.ts                # Engine selection (no "agent" terminology)
│   │   ├── SwarmDispatcher.ts            # Parallel dispatch to multiple engines
│   │   ├── SeamlessBlender.ts            # Cross-engine normalisation
│   │   └── QualityInspector.ts          # Frame QA post-generation
│   ├── engines/                          # VLM clients (never called "agents")
│   │   ├── types.ts
│   │   ├── kling.ts
│   │   ├── veo3.ts
│   │   ├── seedance.ts
│   │   ├── skyreels.ts
│   │   ├── luma.ts
│   │   ├── runway.ts
│   │   ├── pika.ts
│   │   ├── minimax.ts
│   │   ├── hunyuan.ts
│   │   ├── wan.ts
│   │   ├── ltx.ts
│   │   └── cogvideox.ts
│   ├── fal/
│   │   ├── client.ts
│   │   ├── lighting.ts
│   │   ├── character.ts
│   │   ├── enhancement.ts
│   │   ├── sync.ts
│   │   ├── training.ts
│   │   └── proxy.ts
│   ├── brain/
│   │   ├── model1.ts                     # Llama 4 Vision MoE interface
│   │   ├── model2.ts                     # Mochi/SVD interface
│   │   ├── council.ts                    # Fallback + distillation
│   │   ├── orchestrator.ts               # Full pipeline coordinator
│   │   ├── agentic-loop.ts              # Plan→Critique→Revise
│   │   ├── tree-search.ts               # MCTS for film direction
│   │   └── prompts.ts                    # System prompts
│   ├── firewall/
│   │   ├── domain-guard.ts              # 4 domain databases + sanitisation
│   │   └── vocabulary.ts               # Marketing vocabulary constraints
│   ├── intelligence/
│   │   ├── crew.ts                      # Cheap crew roster
│   │   ├── probe-battery.ts             # 120 standardised probes
│   │   ├── analyser.ts                  # Analysis engine
│   │   ├── update-watcher.ts            # Model version monitoring
│   │   └── report-schema.ts             # Intelligence report types
│   ├── audio/...
│   ├── timeline/...
│   ├── vault/...
│   ├── location/...
│   ├── upscale/...
│   ├── avatar/...
│   ├── queue/...
│   ├── storage/...
│   ├── telemetry/...
│   ├── moderation/...
│   ├── credits.ts
│   ├── auth.ts
│   ├── db.ts
│   └── redis.ts
│
├── workers/
│   ├── das-pull.ts
│   ├── training-pipeline.ts
│   ├── distillation.ts
│   ├── quality-gate.ts
│   └── intelligence-cron.ts
│
├── store/
│   ├── editor.ts                         # Timeline state
│   ├── vault.ts                          # Vault state
│   ├── jobs.ts                           # Active job tracking
│   └── ui.ts                             # Panel state, active tools
│
└── middleware.ts                          # Auth guard + rate limiting
```

---

## 15. DEV ACCOUNT & ACCESS CONTROL

### Dev Account Seed
```typescript
// prisma/seed.ts — runs on `prisma db seed`

import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function seedDevAccount() {
  const existing = await db.user.findUnique({
    where: { email: 'innovative.trailers@gmail.com' }
  })

  if (!existing) {
    await db.user.create({
      data: {
        email: 'innovative.trailers@gmail.com',
        name: 'INNOVATIVE Dev',
        role: 'ADMIN',
        creditBalance: 9999999,    // Effectively unlimited
        totalGenerated: 0,
        // No password hash — must login via Google OAuth
      }
    })
    console.log('✓ Dev account seeded: innovative.trailers@gmail.com')
    console.log('  Role: ADMIN | Credits: Unlimited | Login: Google OAuth')
  }
}

seedDevAccount()
```

### Dev Account Behaviour
```typescript
// src/lib/credits.ts — checkAndDeductCredits()

// Dev account bypass:
if (user.role === 'ADMIN') {
  // Check API has credits (don't let API go negative)
  // But do NOT deduct from user.creditBalance
  // Log the operation but don't block it
  await db.apiUsageLog.create({
    data: { provider, model, userId, jobId, costCents: estimatedCost, latencyMs: 0, success: true }
  })
  return  // Skip deduction
}
```

### Access Control Summary
| Role | Monthly Credits | Model Access | Feature Gates | Token Deduction |
|---|---|---|---|---|
| FREE | 50 (trial only) | Draft + Standard | Simple mode only | Yes |
| PRO | 500 | Draft → Premium | Advanced mode | Yes |
| STUDIO | 2,000 | All except Film Grade | All except Ultimate | Yes |
| ULTIMATE | 6,000 | All models | All features | Yes |
| ADMIN | Unlimited | All models | All features | **No — bypassed** |

---

## TERMINOLOGY REFERENCE (No "Agent" in Code)

The word **"agent"** must not appear in any user-facing text, component name, function name, variable name, file name, or API endpoint.

| Old Term | Replacement |
|---|---|
| `SwarmRouter` | `MediaRouter` |
| `AgentCrew` | `ProcessingCrew` |
| `VideoAgent` | `VideoEngine` |
| `RoutingAgent` | `SceneProcessor` |
| `agent` (general) | `engine`, `processor`, `handler`, `dispatcher` |
| "AI agents" (UI) | "AI engines", "Smart processing" |
| "Model agents" | "Processing engines" |
| "Multi-agent" | "Multi-engine" |

---

*Cinematic Forge by INNOVATIVE — Master Roadmap v2.0*  
*Generated: May 2026 | All 106 features | 30 sprints | Complete dependency index*
