export const MODEL_COSTS: Record<string, number> = {
  'veo-3.1':              35,
  'kling-3.0':            25,
  'seedance-2.0':         20,
  'runway-gen4':          22,
  'hunyuan-video-1.5':    12,
  'luma-ray3':             8,
  'minimax-2.3':          10,
  'cogvideox':             6,
  'wan-2.2':               2,
  'pika-2.5':              8,
  'skyreels-v3':          18,
  'ltx-2.3':               6,
  'ltx-2.3-fast':          2,
  'pixverse-c1':          28,
  'pixverse-v6':          14,
  'hunyuan-hy-motion':    20,
  'hunyuan-world-mirror': 22,
  'hunyuan-r-dmesh':      25,
  'nano-banana-2':         2,
  'nano-banana-pro':       5,
  'grok-imagine-video':   20,  // $0.05/s API cost → 20cr/5s covers margin
  // ── V3 model expansion (target = 21 video models) ──
  'sora-2':               35,  // replicate (openai/sora-2) — physics lead
  'happyhorse-1.0':       22,  // fal — dialogue/emotion performance lead
  'kling-o3':             30,  // fal — premium character emotion
  'hailuo-2.3':           12,  // fal — CGI character / product hybrid
}

export const MODEL_SPECIALTIES: Record<string, {
  costTier:   'budget' | 'mid' | 'premium'
  strengths:  string[]
  weaknesses: string[]
  bestFor:    string
}> = {
  // ── V3 model expansion ──
  'sora-2': {
    costTier:   'premium',
    strengths:  ['physics_simulation', 'fluid_dynamics', 'realistic_physics', 'photorealism', 'aerial'],
    weaknesses: ['cost', 'not_on_fal'],
    bestFor:    'Physics simulation — fluid, fire, structural collapse, realistic dynamics',
  },
  'happyhorse-1.0': {
    costTier:   'premium',
    strengths:  ['dialogue', 'character_emotion', 'lip_sync', 'physical_action', 'facial_consistency'],
    weaknesses: ['cost'],
    bestFor:    'Dialogue close-ups and emotional character performance',
  },
  'kling-o3': {
    costTier:   'premium',
    strengths:  ['character_emotion', 'dialogue', 'physical_action', 'facial_consistency', 'human_motion'],
    weaknesses: ['cost'],
    bestFor:    'Premium character emotion + dialogue close-ups',
  },
  'hailuo-2.3': {
    costTier:   'mid',
    strengths:  ['cgi_character', 'product_commercial', 'motion_from_still', 'image_to_video'],
    weaknesses: ['extreme_vfx'],
    bestFor:    'CGI character and product shots animated from stills',
  },
  'veo-3.1': {
    costTier:   'premium',
    strengths:  ['fluid_dynamics', 'physics', 'photorealism', 'native_audio', 'realism'],
    weaknesses: ['cost', 'slow'],
    bestFor:    'Photorealistic hero shots, water/fire physics, native audio',
  },
  'kling-3.0': {
    costTier:   'mid',
    strengths:  ['locomotion', 'hands', 'facial_consistency', 'human_motion', 'vehicle'],
    weaknesses: ['environments', 'abstract'],
    bestFor:    'Human movement, vehicle pans, hand close-ups',
  },
  'seedance-2.0': {
    costTier:   'mid',
    strengths:  ['character_detail', 'dialogue', 'fine_motor', 'lip_sync', 'faces'],
    weaknesses: ['environments', 'action'],
    bestFor:    'Dialogue scenes, character close-ups, emotional performance',
  },
  'skyreels-v3': {
    costTier:   'mid',
    strengths:  ['infinite_length', 'emotional_acting', 'portrait', 'facial_expression', 'long_sequence'],
    weaknesses: ['cost_vs_budget'],
    bestFor:    'Infinite-length sequences, long-form portrait, emotional acting',
  },
  'runway-gen4': {
    costTier:   'mid',
    strengths:  ['multi_shot', 'character_continuity', 'commercial', 'product'],
    weaknesses: ['abstract', 'physics'],
    bestFor:    'Multi-shot sequences, product advertising, brand consistency',
  },
  'pixverse-c1': {
    costTier:   'premium',
    strengths:  ['cgi_vfx', 'fluid_dynamics', 'action_choreography', 'atmospheric', 'stylised', 'spatial_consistency', 'particles', 'lighting_effects'],
    weaknesses: ['cost', 'generation_time'],
    bestFor:    'CGI VFX: particles, fire, explosions, atmospheric effects, combat',
  },
  'pixverse-v6': {
    costTier:   'mid',
    strengths:  ['camera_control', 'character_emotion', 'multi_shot', 'native_audio', 'commercial'],
    weaknesses: ['extreme_vfx'],
    bestFor:    'Cinematic multi-shot with precise camera language, 15s stories',
  },
  'hunyuan-video-1.5': {
    costTier:   'mid',
    strengths:  ['crowd', 'cyberpunk', 'multi_person', 'density', 'urban'],
    weaknesses: ['portrait', 'dialogue'],
    bestFor:    'Crowd scenes, dense urban environments, cyberpunk aesthetics',
  },
  'hunyuan-hy-motion': {
    costTier:   'mid',
    strengths:  ['3d_character_animation', 'motion_capture_style', 'skeletal_animation', 'dance', 'sports'],
    weaknesses: ['environments', 'non_humanoid'],
    bestFor:    'CGI character animation: walk cycles, dance, combat, sports',
  },
  'hunyuan-world-mirror': {
    costTier:   'mid',
    strengths:  ['3d_reconstruction', 'scene_geometry', 'environment_cgi', 'depth_accurate'],
    weaknesses: ['character_detail', 'speed'],
    bestFor:    'CGI environment reconstruction, 3D world building from reference',
  },
  'hunyuan-r-dmesh': {
    costTier:   'premium',
    strengths:  ['mesh_animation', '3d_vfx', 'surface_tracking', 'procedural_cgi'],
    weaknesses: ['cost', 'complexity'],
    bestFor:    'Advanced CGI: mesh deformation, 3D surface animation',
  },
  'luma-ray3': {
    costTier:   'budget',
    strengths:  ['aerial', 'camera_movement', 'environments', 'landscape', 'establishing'],
    weaknesses: ['faces', 'dialogue'],
    bestFor:    'Aerial shots, landscape reveals, smooth camera movements',
  },
  'minimax-2.3': {
    costTier:   'budget',
    strengths:  ['long_form', 'consistent_quality', 'narrative', 'physics'],
    weaknesses: ['extreme_detail'],
    bestFor:    'Long sequences up to 6min, narrative consistency',
  },
  'cogvideox': {
    costTier:   'budget',
    strengths:  ['text_rendering', 'prompt_adherence', 'static_scenes', 'precise'],
    weaknesses: ['motion', 'realism'],
    bestFor:    'Text overlays, exact prompt matching, static scenes',
  },
  'wan-2.2': {
    costTier:   'budget',
    strengths:  ['wildlife', 'texture', 'nature', 'fur', 'organic'],
    weaknesses: ['urban', 'human', 'dialogue'],
    bestFor:    'Wildlife, nature texture, organic materials, budget backgrounds',
  },
  'ltx-2.3': {
    costTier:   'mid',
    strengths:  ['4k_native', '50fps', 'portrait_vertical', 'fast', 'audio_stereo'],
    weaknesses: ['complex_physics'],
    bestFor:    '4K portrait/vertical, high-resolution fast generation',
  },
  'ltx-2.3-fast': {
    costTier:   'budget',
    strengths:  ['speed', 'iteration', 'draft'],
    weaknesses: ['quality', 'resolution'],
    bestFor:    'Quick drafts, storyboard previews, rapid iteration',
  },
  'pika-2.5': {
    costTier:   'budget',
    strengths:  ['object_editing', 'close_up', 'product', 'swap', 'targeted_edit'],
    weaknesses: ['full_scene', 'long_form'],
    bestFor:    'Object replacement, product shots, targeted frame edits',
  },
  'grok-imagine-video': {
    costTier:   'mid',
    strengths:  ['native_audio', 'speed', 'photorealism', 'text_to_video', 'image_to_video', 'creative_style', 'short_clips'],
    weaknesses: ['max_15s', 'not_on_fal'],
    bestFor:    'Fast photorealistic clips with native audio, 6–15s, ~30s generation time',
  },
}

export const FAL_MODEL_IDS: Record<string, string> = {
  // Video generation
  'veo-3.1':              'fal-ai/veo3',
  'kling-3.0':            'fal-ai/kling-video/v1.6/pro/text-to-video',
  'seedance-2.0':         'fal-ai/seedance-video-lite',
  'skyreels-v3':          'fal-ai/skyreels-v2-t2v',
  'luma-ray3':            'fal-ai/luma-dream-machine',
  'minimax-2.3':          'fal-ai/minimax-video',
  'cogvideox':            'fal-ai/cogvideox-5b',
  'wan-2.2':              'fal-ai/wan/v2.2-a14b/text-to-video',  // fast a14b endpoint (was slow shared fal-ai/wan-t2v)
  'ltx-2.3':              'fal-ai/ltx-video-v0-9-7',
  'ltx-2.3-fast':         'fal-ai/ltx-video-v0-9-7',
  'pika-2.5':             'fal-ai/pika-v2-turbo',
  'pixverse-c1':          'fal-ai/pixverse/v4.5',
  'pixverse-v6':          'fal-ai/pixverse/v4',
  'hunyuan-video-1.5':    'fal-ai/hunyuan-video',
  'hunyuan-hy-motion':    'fal-ai/hunyuan-video',
  'hunyuan-world-mirror': 'fal-ai/hunyuan-video',
  'hunyuan-r-dmesh':      'fal-ai/hunyuan-video',

  // V3 model expansion (FAL-hosted). sora-2 intentionally excluded — it runs on
  // Replicate (openai/sora-2) via REPLICATE_API_TOKEN, not FAL (like grok-imagine-video).
  'happyhorse-1.0':       'fal-ai/happyhorse-v1',
  'kling-o3':             'fal-ai/kling-video/v2/pro/text-to-video',
  'hailuo-2.3':           'fal-ai/minimax-video',

  // Image generation — all via FAL
  'nano-banana-2':        'fal-ai/gemini-flash-image',
  'nano-banana-pro':      'fal-ai/gemini-pro-image',
  'flux-pro':             'fal-ai/flux-pro',
  'flux-ultra':           'fal-ai/flux-pro/v1.1-ultra',

  // grok-imagine-video intentionally excluded — uses XAI_API_KEY directly via api.x.ai
  // All other models above use FAL_API_KEY

  // LLMs via OpenRouter on FAL
  'claude-sonnet':        'openrouter/anthropic/claude-sonnet-4-6',
  'claude-haiku':         'openrouter/anthropic/claude-haiku-4-5',
  'grok-3':               'openrouter/x-ai/grok-3',
  'groq-llama':           'openrouter/groq/llama-3.3-70b-versatile',
  'kimi-k2':              'openrouter/moonshotai/kimi-k2-0905',
  'qwen-max':             'openrouter/qwen/qwen3-7b-max',
}

export const TIER_ENGINE_MAP: Record<string, string> = {
  'draft':     'ltx-2.3-fast',
  'standard':  'wan-2.2',
  'cinematic': 'luma-ray3',
  'film':      'kling-3.0',
}

// Friendly display data for the AI Director "Model Council" picker — EVERY video model.
// Registry-driven: adding a model here auto-adds it to the picker (ids match MODEL_COSTS).
export const MODEL_COUNCIL_DISPLAY: Array<{
  id:       string
  name:     string
  role:     string
  tagline:  string
  dotColor: string
}> = [
  { id: 'veo-3.1',            name: 'Veo 3',         role: 'Visual Lead',        tagline: 'Photorealism, physics, native audio', dotColor: '#a855f7' },
  { id: 'kling-3.0',          name: 'Kling Pro',     role: 'Motion Expert',      tagline: 'Camera movement, locomotion',         dotColor: '#3b82f6' },
  { id: 'seedance-2.0',       name: 'Seedance',      role: 'Scene Architect',    tagline: 'Long scenes, continuity, dialogue',   dotColor: '#22c55e' },
  { id: 'runway-gen4',        name: 'Runway',        role: 'Style Artist',       tagline: 'Camera control, Motion Brush, Aleph',  dotColor: '#ec4899' },
  { id: 'luma-ray3',          name: 'Luma',          role: 'Action Director',    tagline: 'Aerial, landscape, dynamic motion',   dotColor: '#10b981' },
  { id: 'minimax-2.3',        name: 'Minimax',       role: 'Dialogue Expert',    tagline: 'Talking heads, facial sync',          dotColor: '#f59e0b' },
  { id: 'pixverse-c1',        name: 'PixVerse C1',   role: 'VFX Specialist',     tagline: 'Particles, fluid, atmospheric',       dotColor: '#06b6d4' },
  { id: 'pixverse-v6',        name: 'PixVerse V6',   role: 'Stylist',            tagline: 'General stylised video',              dotColor: '#0ea5e9' },
  { id: 'skyreels-v3',        name: 'SkyReels V3',   role: 'Long-form Director', tagline: 'Infinite-length sequences',           dotColor: '#8b5cf6' },
  { id: 'ltx-2.3',            name: 'LTX 2.3',       role: 'Resolution Master',  tagline: '4K / 50fps high resolution',          dotColor: '#14b8a6' },
  { id: 'ltx-2.3-fast',       name: 'LTX Fast',      role: 'Draft Artist',       tagline: 'Instant pre-vis drafts',              dotColor: '#2dd4bf' },
  { id: 'wan-2.2',            name: 'Wan 2.2',       role: 'Budget Workhorse',   tagline: 'Environments, nature, low cost',      dotColor: '#84cc16' },
  { id: 'cogvideox',          name: 'CogVideoX',     role: 'Open Source',        tagline: 'General-purpose generation',          dotColor: '#a3e635' },
  { id: 'hunyuan-video-1.5',  name: 'HunyuanVideo',  role: 'Crowd Master',       tagline: 'Urban density, volumetric light',     dotColor: '#f472b6' },
  { id: 'hunyuan-hy-motion',  name: 'HY-Motion',     role: '3D Animator',        tagline: 'Character animation, walk cycles',    dotColor: '#fb7185' },
  { id: 'pika-2.5',           name: 'Pika 2.5',      role: 'Commercial Pro',     tagline: 'Product shots, clean style',          dotColor: '#fbbf24' },
  { id: 'grok-imagine-video', name: 'Grok Imagine',  role: 'Audio-Native',       tagline: 'Fast clips with synced audio',        dotColor: '#e879f9' },
  { id: 'sora-2',             name: 'Sora 2',        role: 'Physics Lead',       tagline: 'Fluid, fire, realistic dynamics',     dotColor: '#6366f1' },
  { id: 'happyhorse-1.0',     name: 'HappyHorse',    role: 'Performance Lead',   tagline: 'Dialogue close-ups, emotion',         dotColor: '#ef4444' },
  { id: 'kling-o3',           name: 'Kling O3',      role: 'Emotion Premium',    tagline: 'Premium character emotion',           dotColor: '#0891b2' },
  { id: 'hailuo-2.3',         name: 'Hailuo 2.3',    role: 'CGI Hybrid',         tagline: 'CGI character, product, image-to-video', dotColor: '#eab308' },
]
