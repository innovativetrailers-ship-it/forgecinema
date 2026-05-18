# CINÉMA — CURSOR PROMPT ADDENDUM v2.0
## Cinematic Forge by INNOVATIVE
### New Requirements — Add to Existing Build

> This document extends CINEMA_cursor_prompt.md. All items here are mandatory additions.
> Apply in addition to the full existing spec. Where conflicts exist, this document takes precedence.

---

## PART 1 — BRANDING & NAMING

**App name**: Cinematic Forge  
**By**: INNOVATIVE  
**Domain**: cinematicforge.ai  
**Primary colour**: Neon teal `#00e5c8`  
**Background**: `#0d1117`  
**Accent**: `#00e5c8` (replaces ALL amber `#c17d00` from previous spec)

### CRITICAL: No "agent" terminology anywhere in code
Replace all instances of the following:
```
SwarmRouter → MediaRouter
AgentCrew → ProcessingCrew  
VideoAgent → VideoEngine
RoutingAgent → SceneProcessor
agent (variables/functions) → engine, processor, handler, dispatcher
"AI agents" (UI text) → "Smart processing engines"
"multi-agent" → "multi-engine"
AgenticLoop → ReasoningLoop
```

Search and replace before deploying:
```bash
grep -r "agent\|Agent" src/ --include="*.ts" --include="*.tsx"
# Every match must be reviewed and renamed
```

---

## PART 2 — LANDING PAGE

Create `src/app/page.tsx` — Full marketing landing page:

```tsx
// Cinematic Forge landing page
// Route: /
// No auth required

export default function LandingPage() {
  return (
    <main className="bg-[#0d1117] text-white min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <Footer />
    </main>
  )
}
```

### HeroSection (`src/components/landing/HeroSection.tsx`)
- Full viewport height
- Background: auto-playing muted looping AI-generated video showcase
- Center: "Cinematic Forge" in large white sans-serif
- Subtitle: "by INNOVATIVE" in neon teal, smaller
- Tagline: "Professional AI Film Production. For Everyone."
- Two CTA buttons:
  - "Start Free Trial" → `/signup` (neon teal filled)
  - "Sign In" → `/login` (teal outline)
- No navigation bar on landing — just the CTA buttons

### PricingSection (`src/components/landing/PricingSection.tsx`)
Monthly/Yearly toggle at top. Four plan cards:

```tsx
const PLANS = [
  {
    name: 'Free Trial',
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: '50 credits (once)',
    cta: 'Start Free',
    features: ['Text-to-video', 'Standard quality', 'Simple mode only', '5 exports'],
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 19,
    yearlyPrice: 190,
    credits: '500 credits/month',
    cta: 'Start Pro',
    features: ['Advanced timeline', 'All quality tiers', 'Character vault', '500 exports'],
    highlighted: false,
  },
  {
    name: 'Studio',
    monthlyPrice: 49,
    yearlyPrice: 490,
    credits: '2,000 credits/month',
    cta: 'Start Studio',
    features: ['Ultimate mode', 'Film exports', 'Node compositor', 'Client review portal'],
    highlighted: true,  // Most popular — teal border
  },
  {
    name: 'Ultimate',
    monthlyPrice: 99,
    yearlyPrice: 990,
    credits: '6,000 credits/month',
    cta: 'Start Ultimate',
    features: ['All features', 'AI Director', 'DCP export', 'Plugin API', 'Priority queue'],
    highlighted: false,
  },
]
```

Each plan card shows: Stripe Pay button + PayPal button side by side.

---

## PART 3 — AUTHENTICATION

### Login Page (`src/app/(auth)/login/page.tsx`)
```tsx
export default function LoginPage() {
  return (
    <AuthShell title="Sign in to Cinematic Forge">
      {/* Google OAuth — primary */}
      <GoogleSignInButton />  {/* calls signIn('google') */}
      
      <Divider text="or continue with email" />
      
      {/* Credentials */}
      <CredentialsForm />  {/* email + password */}
      
      <p>Don't have an account? <Link href="/signup">Sign up</Link></p>
    </AuthShell>
  )
}
```

### Signup Page (`src/app/(auth)/signup/page.tsx`)
Multi-step flow — Zustand `signupStore`:

**Step 1 — Google or Email**
```tsx
// Primary: Google OAuth
<GoogleSignInButton label="Continue with Google" />
// Google accounts are pre-verified — skip to Step 2 immediately

// Secondary: Email form
<SignupEmailForm />  // name, email, password, confirm password
// On submit: create unverified user → advance to Step 2
```

**Step 2 — Plan Selection**
```tsx
<PlanSelector
  billing="monthly | yearly"  // toggle at top
  onSelect={(planId) => setSelectedPlan(planId)}
/>
// "Continue Free" link for trial (50 credits, no card, immediate access)
```

**Step 3 — Payment**
```tsx
<PaymentOptions planId={selectedPlan} billing={billing}>
  {/* Stripe */}
  <StripeCheckoutButton
    priceId={STRIPE_PRICE_ID[selectedPlan][billing]}
    onSuccess={() => activateAndRedirect()}
  />
  
  {/* PayPal */}
  <PayPalButton
    planId={PAYPAL_PLAN_ID[selectedPlan][billing]}
    onApprove={(orderId) => capturePayPalAndActivate(orderId)}
  />
</PaymentOptions>
```

**Access gate**: User is redirected to `/simple` ONLY after:
- Payment captured successfully (Stripe `payment_intent.succeeded` or PayPal `PAYMENT.CAPTURE.COMPLETED`), OR
- Free trial selected (no payment required — sets role=FREE, credits=50)

```typescript
// src/lib/auth/verification.ts
export async function activateUser(params: {
  userId: string
  planId: 'pro' | 'studio' | 'ultimate' | 'free'
  paymentProvider?: 'stripe' | 'paypal'
  externalPaymentId?: string
}): Promise<void> {
  // 1. Verify payment with provider if not free
  if (params.paymentProvider === 'stripe') {
    await verifyStripePayment(params.externalPaymentId!)
  } else if (params.paymentProvider === 'paypal') {
    await verifyPayPalCapture(params.externalPaymentId!)
  }
  
  // 2. Set role + credits
  const roleMap = { free: 'FREE', pro: 'PRO', studio: 'STUDIO', ultimate: 'ULTIMATE' }
  const creditsMap = { free: 50, pro: 500, studio: 2000, ultimate: 6000 }
  
  await db.user.update({
    where: { id: params.userId },
    data: {
      role: roleMap[params.planId] as UserRole,
      creditBalance: creditsMap[params.planId],
      subscriptionStatus: params.planId === 'free' ? 'trial' : 'active',
    }
  })
  
  // 3. Send welcome email
  await sendWelcomeEmail(params.userId)
}
```

### T&Cs
Create `src/app/(legal)/terms/page.tsx` — Linked from signup checkbox:
- "I agree to the [Terms & Conditions] and [Privacy Policy]"
- Checkbox required before proceeding to payment

### Middleware Guard
```typescript
// src/middleware.ts
// Block all /simple, /advanced, /ultimate routes unless:
// - User is authenticated AND
// - User.subscriptionStatus is 'active' or 'trial' AND
// - User.role is NOT 'FREE' with 0 credits remaining
// Redirect to /signup otherwise
```

---

## PART 4 — TOKEN BALANCE BAR (Every Page)

Add `TokenBar` to the editor layout and the landing page header:

```tsx
// src/components/layout/TokenBar.tsx
// Appears fixed at top of every editor page (Simple, Advanced, Ultimate)
// Height: 36px, background: #0d1117 border-bottom: 1px solid #1a1f2e

export function TokenBar() {
  const { balance, isLoading } = useCredits()
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-9 bg-[#0d1117] border-b border-[#1a1f2e] flex items-center justify-between px-4">
      {/* Left: App name */}
      <span className="text-[#00e5c8] font-semibold text-sm">Cinematic Forge</span>
      
      {/* Center: Mode switcher */}
      <ModeSwitcher />
      
      {/* Right: Token balance + purchase */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <HexagonIcon className="w-4 h-4 text-[#00e5c8]" />
          <span className="text-white text-sm font-mono">
            {isLoading ? '...' : balance.toLocaleString()}
          </span>
          <span className="text-gray-500 text-xs">credits</span>
        </div>
        
        <button
          onClick={() => openCreditPurchaseModal()}
          className="text-xs px-2.5 py-1 rounded border border-[#00e5c8] text-[#00e5c8] hover:bg-[#00e5c8]/10 transition"
        >
          + Get More
        </button>
        
        <UserAvatar />
      </div>
    </div>
  )
}
```

### Credit Purchase Modal
```tsx
// src/components/layout/CreditPurchaseModal.tsx
// Opens from "Get More" button — available on every page

const CREDIT_PACKS = [
  { credits: 100, priceUSD: 5, stripeId: process.env.STRIPE_PRICE_CREDITS_100 },
  { credits: 500, priceUSD: 20, stripeId: process.env.STRIPE_PRICE_CREDITS_500 },
  { credits: 2000, priceUSD: 65, stripeId: process.env.STRIPE_PRICE_CREDITS_2000 },
  { credits: 10000, priceUSD: 250, stripeId: process.env.STRIPE_PRICE_CREDITS_10000 },
]

// Each pack shows: Stripe button + PayPal button
// On purchase complete: update displayed balance via React Query invalidation
```

---

## PART 5 — PAYPAL INTEGRATION

Add alongside all Stripe flows:

```typescript
// src/app/api/credits/purchase/paypal/route.ts
import paypal from '@paypal/checkout-server-sdk'

export const paypalClient = new paypal.core.PayPalHttpClient(
  process.env.PAYPAL_MODE === 'live'
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!)
)

// POST /api/credits/purchase/paypal
// Body: { packId: '100' | '500' | '2000' | '10000', userId }
export async function POST(req: Request) {
  const { packId, userId } = await req.json()
  const pack = CREDIT_PACKS.find(p => p.credits === Number(packId))
  
  const request = new paypal.orders.OrdersCreateRequest()
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: { currency_code: 'USD', value: pack.priceUSD.toFixed(2) },
      description: `${pack.credits} Cinematic Forge Credits`,
      custom_id: `${userId}:${packId}`,
    }]
  })
  
  const order = await paypalClient.execute(request)
  return Response.json({ orderId: order.result.id })
}

// POST /api/webhooks/paypal
// Handles: PAYMENT.CAPTURE.COMPLETED
export async function POST(req: Request) {
  const event = await req.json()
  
  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const [userId, packId] = event.resource.custom_id.split(':')
    const pack = CREDIT_PACKS.find(p => p.credits === Number(packId))
    await addCredits(userId, pack.credits, `paypal:${event.resource.id}`)
  }
  
  return new Response('OK', { status: 200 })
}
```

PayPal subscription plans for monthly/yearly:
```typescript
// src/lib/paypal/subscriptions.ts
// Create PayPal subscription products and plans matching Stripe prices
// POST /api/credits/purchase/paypal/subscription
// Handles plan activation via BILLING.SUBSCRIPTION.ACTIVATED webhook
```

---

## PART 6 — DEV ACCOUNT

### Database Seed
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  // Dev account — innovative.trailers@gmail.com
  const existing = await db.user.findUnique({
    where: { email: 'innovative.trailers@gmail.com' }
  })
  
  if (!existing) {
    await db.user.create({
      data: {
        email: 'innovative.trailers@gmail.com',
        name: 'INNOVATIVE Dev',
        role: 'ADMIN',
        creditBalance: 9999999,
        totalGenerated: 0,
        // Login via Google OAuth only — no password
      }
    })
    console.log('✓ Dev account created: innovative.trailers@gmail.com')
    console.log('  Role: ADMIN | Credits: 9,999,999 | Login: Google OAuth')
  } else {
    // Ensure existing account has ADMIN role + unlimited credits
    await db.user.update({
      where: { email: 'innovative.trailers@gmail.com' },
      data: { role: 'ADMIN', creditBalance: 9999999 }
    })
    console.log('✓ Dev account updated to ADMIN with unlimited credits')
  }
}

main().finally(() => db.$disconnect())
```

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Run: `npx prisma db seed`

### Credit System Bypass (ADMIN role)
```typescript
// src/lib/credits.ts
export async function checkAndDeductCredits(
  userId: string,
  operation: string,
  multiplier: number = 1
): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId } })
  
  // ADMIN bypass — no deduction, but log the operation
  if (user?.role === 'ADMIN') {
    await db.apiUsageLog.create({
      data: {
        provider: 'admin_bypass',
        model: operation,
        userId,
        costCents: 0,
        latencyMs: 0,
        success: true,
      }
    })
    return  // Do not deduct credits
  }
  
  // Standard credit check and deduction...
  const cost = OPERATION_COSTS[operation] * multiplier
  if (!user || user.creditBalance < cost) {
    throw new CreditError(`Insufficient credits. Required: ${cost}, Available: ${user?.creditBalance ?? 0}`)
  }
  
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { creditBalance: { decrement: cost } } }),
    db.creditTransaction.create({ data: { userId, amount: -cost, type: 'deduct', description: operation } })
  ])
}
```

---

## PART 7 — OMNICHANNEL MULTI-ENGINE CLIP GENERATION

> One clip can be generated by up to 5+ different processing engines.
> Each engine is called for its specific strength within the clip.
> The SeamlessBlender unifies the result.
> This is the core technical differentiator of Cinematic Forge.

### SceneDecomposer (`src/lib/routing/SceneDecomposer.ts`)

```typescript
import { runModel1 } from '../brain/model1'

export interface SceneSegment {
  segmentId: string
  clipId: string
  startSeconds: number
  endSeconds: number
  prompt: string               // Model 1 writes this — specific to this segment
  engineId: string             // Which processing engine handles this segment
  tier: OutcomeTier
  requirements: string[]       // e.g. ['fluid_dynamics', 'atmosphere']
  characterIds?: string[]
  anchorStartFrameUrl?: string // last frame of previous segment
  anchorEndFrameUrl?: string   // first frame of next segment
  estimatedCredits: number
}

export async function decomposeClip(params: {
  masterPrompt: string
  duration: number             // total clip seconds
  tier: OutcomeTier
  characterIds?: string[]
  locationId?: string
  forceMultiEngine?: boolean   // for testing
}): Promise<SceneSegment[]> {
  
  // Model 1 analyses the prompt and identifies temporal phases
  const decompositionResult = await runModel1({
    systemPrompt: SCENE_DECOMPOSER_SYSTEM_PROMPT,
    userMessage: JSON.stringify(params),
    requireJSON: true,
    schema: SceneDecompositionSchema,
    useReasoningLoop: false,  // Fast — no Plan/Critique for decomposition
  })
  
  const { segments } = JSON.parse(decompositionResult.content)
  
  // For each segment, select the optimal processing engine
  return segments.map((seg: any) => ({
    ...seg,
    engineId: selectOptimalEngine(seg.requirements, params.tier),
    estimatedCredits: calculateSegmentCredits(seg, params.tier),
  }))
}

// Segment → Engine assignment matrix (research-verified)
function selectOptimalEngine(requirements: string[], tier: OutcomeTier): string {
  if (requirements.includes('text_rendering'))     return 'cogvideox'
  if (requirements.includes('fluid_dynamics'))     return 'veo3'
  if (requirements.includes('atmosphere'))         return 'veo3'
  if (requirements.includes('emotional_acting'))   return 'skyreels'
  if (requirements.includes('human_locomotion'))   return 'kling_pro'
  if (requirements.includes('character_detail'))   return 'seedance'
  if (requirements.includes('crowd_dynamics'))     return 'hunyuan'
  if (requirements.includes('aerial_landscape'))   return 'luma'
  if (requirements.includes('wildlife_motion'))    return 'wan'
  if (requirements.includes('cost_efficient'))     return tier === 'Draft' ? 'ltx' : 'wan'
  // Default by tier
  return { Draft: 'wan', Standard: 'hunyuan', Cinematic: 'kling_pro', Film: 'veo3' }[tier] ?? 'hunyuan'
}
```

### SwarmDispatcher (`src/lib/routing/SwarmDispatcher.ts`)

```typescript
// Dispatches all segments in parallel, collects results
export async function dispatchClip(params: {
  segments: SceneSegment[]
  onSegmentComplete?: (segmentId: string, videoUrl: string) => void
}): Promise<{ segmentId: string, videoUrl: string }[]> {
  
  // Dispatch all segments concurrently
  const promises = params.segments.map(async (seg) => {
    const engine = getEngineClient(seg.engineId)
    
    let result
    if (seg.anchorStartFrameUrl || seg.anchorEndFrameUrl) {
      // V2V with frame anchors for temporal continuity
      result = await engine.generateVideoV2V({
        prompt: seg.prompt,
        startFrameUrl: seg.anchorStartFrameUrl,
        endFrameUrl: seg.anchorEndFrameUrl,
        duration: seg.endSeconds - seg.startSeconds,
      })
    } else {
      result = await engine.generateVideo({
        prompt: seg.prompt,
        duration: seg.endSeconds - seg.startSeconds,
        characterRefs: await getCharacterRefs(seg.characterIds),
      })
    }
    
    params.onSegmentComplete?.(seg.segmentId, result.videoUrl)
    return { segmentId: seg.segmentId, videoUrl: result.videoUrl }
  })
  
  return Promise.all(promises)
}
```

### SeamlessBlender (`src/lib/routing/SeamlessBlender.ts`)

```typescript
export async function blendMultiEngineClip(params: {
  segments: Array<{ segmentId: string, videoUrl: string, engineId: string }>
  targetProfile?: BlendProfile  // defaults to HOUSE_LOOK
}): Promise<{ blendedUrl: string }> {
  
  const target = params.targetProfile ?? HOUSE_LOOK
  
  // Step 1: Normalise each segment to house look
  const normalisedSegments = await Promise.all(
    params.segments.map(async (seg) => {
      const profile = ENGINE_PROFILES[seg.engineId] ?? HOUSE_LOOK
      const delta = computeProfileDelta(profile, target)
      const normalisedUrl = await applyColourNormalisation(seg.videoUrl, delta)
      return { ...seg, normalisedUrl }
    })
  )
  
  // Step 2: At each boundary — IC-Light colour temperature match
  for (let i = 0; i < normalisedSegments.length - 1; i++) {
    const segA = normalisedSegments[i]
    const segB = normalisedSegments[i + 1]
    
    // Extract boundary frames
    const lastFrameA = await extractFrame(segA.normalisedUrl, 'last')
    const firstFrameB = await extractFrame(segB.normalisedUrl, 'first')
    
    // IC-Light match temperature
    await matchBoundaryTemperature(lastFrameA, firstFrameB)
  }
  
  // Step 3: FFmpeg concat + 8-frame xfade at each boundary
  const concatScript = buildConcatScript(normalisedSegments, { xfadeDuration: 8/30 })
  const blendedUrl = await runFFmpegConcat(concatScript)
  
  return { blendedUrl }
}
```

### API Endpoint
```typescript
// Clip generation now automatically uses multi-engine decomposition
// when Model 1 determines the prompt has multiple distinct requirements

// src/app/api/jobs/create/route.ts
// When type === 'GENERATE':
// 1. Run SceneDecomposer on the prompt
// 2. If segments.length > 1: use multi-engine path
// 3. If segments.length === 1: use single engine path (original flow)
// 4. Dispatch segments → collect results → SeamlessBlend → deliver
```

---

## PART 8 — COMPLETE PRICING IMPLEMENTATION

```typescript
// src/lib/credits.ts — OPERATION_COSTS (complete)
export const OPERATION_COSTS: Record<string, number> = {
  // Video generation (per 5 seconds of output)
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
  generate_hunyuan: 12,
  // Processing
  relight_iclight: 2,
  upscale_2x_fast: 1,
  upscale_4x_standard: 3,
  upscale_4x_anime: 2,
  upscale_4x_face: 4,
  upscale_4x_maximum: 6,
  upscale_8x: 10,
  upscale_image_2x: 1,
  upscale_image_4x: 2,
  face_restore: 2,
  lipsync: 5,
  transcribe: 1,
  remove_bg: 1,
  depth_map: 1,
  proxy_draft: 0,
  stabilise: 2,
  retime_optical_flow: 3,
  morph_cut: 4,
  grain_restore: 1,
  face_enhance_video: 2,
  // Character
  lora_training: 60,
  ip_adapter_inject: 1,
  performance_capture: 15,
  recast_face: 8,
  recast_full: 20,
  // Audio
  music_generate_30s: 5,
  music_generate_120s: 15,
  speech_generate: 3,
  foley_generate: 4,
  voice_clone: 20,
  translation_per_minute: 8,
  overdub_word: 2,
  studio_sound: 2,
  // 3D / CGI
  cgi_generate_3d: 20,
  cgi_composite: 5,
  // Export
  export_1080p: 8,
  export_4k: 20,
  export_dcp: 40,
  export_imf: 50,
  // Production
  auto_social: 10,
  ai_director: 50,
  storyboard_gen: 15,
  continuity_check: 5,
  highlight_extract: 8,
  avatar_generate: 10,
  talking_photo: 5,
  // Multi-engine clip
  // (billed as sum of segment costs — no markup)
}

// Subscription tier credit allocations
export const TIER_MONTHLY_CREDITS: Record<UserRole, number> = {
  FREE: 50,           // trial only — one time
  PRO: 500,
  STUDIO: 2000,
  ULTIMATE: 6000,
  ADMIN: 9999999,     // unlimited
}

// Stripe Price IDs mapping
export const STRIPE_PRICES: Record<string, Record<string, string>> = {
  pro:      { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!, yearly: process.env.STRIPE_PRICE_PRO_YEARLY! },
  studio:   { monthly: process.env.STRIPE_PRICE_STUDIO_MONTHLY!, yearly: process.env.STRIPE_PRICE_STUDIO_YEARLY! },
  ultimate: { monthly: process.env.STRIPE_PRICE_ULTIMATE_MONTHLY!, yearly: process.env.STRIPE_PRICE_ULTIMATE_YEARLY! },
}

// Monthly credit top-up at subscription renewal
// Handled by Stripe webhook: invoice.payment_succeeded
export async function handleSubscriptionRenewal(
  userId: string,
  planId: 'pro' | 'studio' | 'ultimate'
): Promise<void> {
  const roleMap = { pro: 'PRO', studio: 'STUDIO', ultimate: 'ULTIMATE' } as const
  await db.user.update({
    where: { id: userId },
    data: { creditBalance: TIER_MONTHLY_CREDITS[roleMap[planId]] }
  })
  // Note: resets to tier allocation, does not accumulate
}
```

---

## PART 9 — UI WIRING CHECKLIST

After applying all code, verify in Cursor these items are wired:

### Sidebar Icons (Left icon rail)
Every icon in the vertical sidebar must call `useUIStore().setActivePanel(panelName)`:
```typescript
// src/store/ui.ts
interface UIStore {
  activePanel: 'generate' | 'vault' | 'library' | 'location' | 'transitions' | 'sfx' | 'audio' | 'stock' | 'avatar' | 'brand' | null
  activeTool: 'select' | 'razor' | 'repaint' | 'text' | 'motion_brush' | 'track' | null
  activeRightPanel: 'properties' | 'colour' | 'audio' | 'vfx' | 'cgi' | 'director' | 'upscale'
  setActivePanel: (panel: UIStore['activePanel']) => void
  setActiveTool: (tool: UIStore['activeTool']) => void
  setActiveRightPanel: (panel: UIStore['activeRightPanel']) => void
}
```

Each icon: `onClick={() => setActivePanel('vault')}` etc.  
The panel content area renders based on `activePanel`:
```tsx
{activePanel === 'vault' && <VaultPanel />}
{activePanel === 'generate' && <GeneratePanel />}
{activePanel === 'library' && <LibraryPanel />}
// etc.
```

### Top Toolbar Buttons
Each toolbar button calls `setActiveTool()` AND sets corresponding keyboard shortcut via `useEffect`.

### Character Onboarding
"Onboard character" button → 6-step modal:
1. Name
2. Upload face references (up to 5 images, AI quality score shown)
3. Costume description
4. SFX makeup state
5. Voice (record or select ElevenLabs voice)
6. Confirm → POST to `/api/vault/character/create`

### Generate Button
```typescript
// Must:
// 1. Check credits before submitting
// 2. Show credit cost preview before generation starts
// 3. POST to /api/jobs/create with full payload
// 4. Subscribe to SSE stream /api/jobs/[id]/stream
// 5. Show live progress on the clip placeholder
// 6. On complete: add clip to timeline with generated URL
```

### Repaint Workflow
```typescript
// 1. User highlights clip section on timeline
// 2. Right-click → Repaint (or R key shortcut)
// 3. RepaintModal opens with: original clip, prompt field, model selector
// 4. On confirm: POST /api/jobs/create with type='REPAINT'
// 5. SSE progress inline in modal
// 6. On complete: replace section in timeline
```

---

## PART 10 — FINAL CHECKLIST FOR CURSOR

Before declaring any sprint complete, verify:

**Auth & Onboarding**
- [ ] Landing page renders at /
- [ ] Google OAuth login works
- [ ] Signup with T&Cs checkbox
- [ ] Stripe payment completes → role updated → redirect to /simple
- [ ] PayPal payment completes → role updated → redirect to /simple
- [ ] Free trial → role=FREE, credits=50 → redirect to /simple
- [ ] Dev account: innovative.trailers@gmail.com → ADMIN → no credit deduction

**Token System**
- [ ] TokenBar visible on all editor pages (top of every page)
- [ ] Balance updates after each operation
- [ ] "Get More" button opens purchase modal
- [ ] Purchase modal has Stripe + PayPal options
- [ ] Admin role bypasses all credit checks

**Omnichannel Routing**
- [ ] SceneDecomposer correctly identifies segment requirements
- [ ] Multiple engines dispatched in parallel for complex clips
- [ ] SeamlessBlender runs after all segments complete
- [ ] Single-engine clips still work (no regression)
- [ ] User sees one unified clip — no awareness of multi-engine process
- [ ] Credits billed correctly per segment

**UI Wiring**
- [ ] All sidebar icons open correct panels
- [ ] All toolbar buttons activate correct tools
- [ ] All properties panel fields update clip state
- [ ] Repaint modal fully functional
- [ ] Character onboarding 6-step flow completes
- [ ] No broken buttons anywhere

**Terminology**
- [ ] Zero instances of "agent" visible in any UI
- [ ] Zero instances of "agent" in any file names
- [ ] Zero instances of VLM names (Kling, Veo, Seedance, etc.) in user-facing text
- [ ] Tier labels only: "Quick Draft / Standard / Cinematic / Film Grade"

---

*CINÉMA Cursor Prompt Addendum v2.0 — Cinematic Forge by INNOVATIVE*
*Apply alongside CINEMA_cursor_prompt.md. This document takes precedence on conflicts.*
