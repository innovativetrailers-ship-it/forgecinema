# CINÉMA — COMPLETE UI REBUILD & FULL FEATURE WIRING
## Cursor Prompt: Zero-Gap Interface, Neon Teal Theme, Every Tool Visible

> The app is running but critically incomplete. Every feature discussed in the full spec exists in the codebase but is not wired to the UI. This prompt fixes ALL of that. Read every line. Build every component. Wire every button. Leave nothing disconnected.

---

## PRIORITY 1 — COLOUR SYSTEM OVERHAUL (DO THIS FIRST)

Replace the entire colour scheme. The current amber/yellow must be replaced with neon teal. The background is too dark and crushes readability.

### New Design Tokens — create `src/styles/tokens.css`

```css
:root {
  /* ── Backgrounds — lighter than current, professional dark IDE ── */
  --bg-base:        #0d1117;   /* page background */
  --bg-elevated:    #161c26;   /* panels, sidebars */
  --bg-surface:     #1e2636;   /* cards, inputs */
  --bg-hover:       #252f40;   /* hover state */
  --bg-active:      #2e3b52;   /* active/selected */

  /* ── Neon Teal — replaces ALL amber/yellow throughout the app ── */
  --teal-bright:    #00e5c8;   /* primary accent — neon teal */
  --teal-mid:       #00b8a0;   /* secondary accent */
  --teal-dark:      #007a6a;   /* border accent */
  --teal-glow:      rgba(0, 229, 200, 0.12);  /* glow bg */
  --teal-border:    rgba(0, 229, 200, 0.25);  /* teal border */

  /* ── Text — much more legible than current ── */
  --text-primary:   #e8edf5;   /* main text — near white with blue tint */
  --text-secondary: #8a9bbf;   /* secondary text */
  --text-tertiary:  #4a5a78;   /* hints, disabled */
  --text-teal:      #00e5c8;   /* teal text on dark */

  /* ── Semantic colours ── */
  --success:        #22c55e;
  --warning:        #f59e0b;
  --danger:         #ef4444;
  --info:           #3b82f6;

  /* ── Track colours — timeline tracks ── */
  --track-video:    #3b82f6;   /* blue */
  --track-vfx:      #8b5cf6;   /* purple */
  --track-cgi:      #ec4899;   /* pink */
  --track-music:    #22c55e;   /* green */
  --track-voice:    #f97316;   /* orange */
  --track-sfx:      #06b6d4;   /* cyan */
  --track-caption:  #6b7280;   /* grey */
  --track-motion:   #a78bfa;   /* lavender */

  /* ── Borders ── */
  --border:         rgba(139, 155, 191, 0.12);
  --border-mid:     rgba(139, 155, 191, 0.22);

  /* ── Shadows ── */
  --shadow-panel:   0 4px 24px rgba(0, 0, 0, 0.4);
  --shadow-teal:    0 0 20px rgba(0, 229, 200, 0.15);
}
```

### Global replacements — run these find-and-replace operations across ALL files:
- `#c17d00` → `#00e5c8`
- `#BA7517` → `#00b8a0`
- `#854F0B` → `#007a6a`
- `#EF9F27` → `#00e5c8`
- `amber` class references → `teal` equivalents
- `var(--color-background-primary)` on dark containers → `var(--bg-elevated)`
- All `color: var(--color-text-primary)` in dark panels → `color: var(--text-primary)`

---

## PRIORITY 2 — COMPLETE LAYOUT ARCHITECTURE

The layout must be a single-page app with a permanent left sidebar, top toolbar, main content area, and right properties panel. Every feature must be reachable without navigating away.

### `src/components/layout/AppShell.tsx`

```tsx
// Root layout — always rendered
export function AppShell() {
  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-body">
        <IconRail />          {/* 48px — leftmost icon strip */}
        <LeftPanel />         {/* 200-280px — context-sensitive panel */}
        <MainContent />       {/* flex:1 — preview + timeline */}
        <RightPanel />        {/* 200-240px — properties */}
      </div>
      {/* Floating panels — always mounted, show/hide via Zustand */}
      <CharacterOnboarding />
      <AssetLibraryDrawer />
      <SFXMakeupPanel />
      <GreenScreenPanel />
      <CastingPanel />
      <LocationPanel />
      <RepaintModal />
      <TimelineEditPanel />
      <ExportDialog />
      <ReviewPortalModal />
      <BrandKitEditor />
      <LoraTrainingStatus />
    </div>
  )
}
```

---

## PRIORITY 3 — TOP BAR (COMPLETE REBUILD)

The current top bar is missing most controls. Replace it entirely.

### `src/components/layout/TopBar.tsx`

The top bar must contain THREE rows:

**Row 1 — Brand + Mode + Account (42px):**
```tsx
// LEFT: CINÉMA logo (teal) + project name (editable inline)
// CENTRE: Mode switcher — Simple | Advanced | Ultimate
//         Quality tier switcher — Draft | Studio | Blockbuster
// RIGHT: Render queue badge (shows count of active jobs)
//        Credits display (⬡ 1,240 — clicking opens purchase modal)
//        Share button
//        Export Film button (teal, prominent)
//        User avatar
```

**Row 2 — Film mode toolbar (36px, only visible in Ultimate mode):**
```tsx
// Shows: Script | Storyboard | AI Director | Continuity | Cast | Locations
// Each is a toggle button that opens the corresponding panel
// Active panel highlighted in teal
```

**Row 3 — Edit toolbar (32px, visible in Advanced + Ultimate):**
```tsx
// Tool selector: Select (V) | Razor (C) | Repaint (R) | Motion Brush (M) | Text (T)
// Separator
// Undo (Cmd+Z) | Redo (Cmd+Shift+Z)
// Separator  
// Zoom: fit | 25% | 50% | 100% | slider
// Separator
// Timecode display (editable — click to jump)
// Separator
// Auto-save indicator
```

Keyboard shortcuts must work: V=select, C=razor, R=repaint, M=motion brush, T=text, Space=play/pause.

---

## PRIORITY 4 — ICON RAIL (LEFT STRIP — 48px)

Every icon must be present and working. Icons show tooltips on hover.

```tsx
// TOP GROUP — primary tools
<IconButton icon="generate"     tooltip="Generate"       panel="generate" />
<IconButton icon="vault"        tooltip="Character Vault" panel="vault" />
<IconButton icon="library"      tooltip="Asset Library"  panel="library" />
<IconButton icon="location"     tooltip="Locations"      panel="location" />
<IconButton icon="cast"         tooltip="Cast Manager"   panel="cast" />

// SEPARATOR

// MIDDLE GROUP — effects & tools
<IconButton icon="sfx-makeup"   tooltip="SFX Makeup"     panel="makeup" />
<IconButton icon="greenscreen"  tooltip="Green Screen"   panel="greenscreen" />
<IconButton icon="cgi"          tooltip="CGI & 3D"       panel="cgi" />
<IconButton icon="vfx"          tooltip="VFX Library"    panel="vfx" />
<IconButton icon="transitions"  tooltip="Transitions"    panel="transitions" />
<IconButton icon="audio"        tooltip="Audio"          panel="audio" />
<IconButton icon="stock"        tooltip="Stock Library"  panel="stock" />

// SEPARATOR

// BOTTOM GROUP — production
<IconButton icon="script"       tooltip="Script"         panel="script" />
<IconButton icon="storyboard"   tooltip="Storyboard"     panel="storyboard" />
<IconButton icon="avatar"       tooltip="AI Avatars"     panel="avatar" />
<IconButton icon="translate"    tooltip="Translate"      panel="translate" />
<IconButton icon="highlight"    tooltip="Highlights"     panel="highlight" />
<IconButton icon="brandkit"     tooltip="Brand Kit"      panel="brandkit" />
<IconButton icon="settings"     tooltip="Settings"       panel="settings" />
```

Active panel icon has teal background. Hovering any icon shows tooltip with panel name.

---

## PRIORITY 5 — LEFT PANEL (COMPLETE WITH ALL TABS)

The left panel switches content based on the active icon. Each panel must be fully built.

### GENERATE PANEL

```tsx
// Section: Prompt
<textarea placeholder="Describe your scene... The Brain will decompose and route to the optimal model" />

// Section: Quick settings
<QualityPills options={['Draft', 'Standard', 'Studio', 'Cinematic', 'Film']} />
<DurationPicker options={['5s', '8s', '10s', '15s', '30s', '60s', 'Custom']} />
<AspectRatioPicker options={['16:9', '9:16', '1:1', '4:5', '21:9']} />

// Section: Model override (collapsible, off by default)
<Collapsible label="Override model routing">
  <ModelGrid /> {/* All 14 models with brief description */}
</Collapsible>

// Section: Camera Director
<Collapsible label="Camera controls">
  <CameraSlider label="Pan" min={-100} max={100} />
  <CameraSlider label="Tilt" min={-45} max={45} />
  <CameraSlider label="Zoom" min={0.5} max={4.0} step={0.1} />
  <CameraSlider label="Push" min={-1} max={1} step={0.1} />
  <CameraPresets /> {/* Slow push, Ken Burns, Aerial reveal, etc. */}
</Collapsible>

// Section: Attached references
<ReferenceAttach label="Character" type="character" />
<ReferenceAttach label="Location" type="location" />
<ReferenceAttach label="Style reference" type="style" />

// Action
<Button variant="teal" fullWidth onClick={handleGenerate}>
  Generate  ·  <CreditCost />
</Button>

// Recent generations
<RecentGenerations />
```

### CHARACTER VAULT PANEL

```tsx
// Cast list with character cards
{characters.map(char => (
  <CharacterCard
    character={char}
    onEdit={() => openOnboarding(char)}
    onGenerate={() => generateWithChar(char)}
    onVoice={() => openVoiceVault(char)}
    onMakeup={() => openMakeup(char)}
    loraStatus={char.loraStatus}  // shows training progress
  />
))}

// Add character button — opens CHARACTER ONBOARDING FLOW
<Button onClick={openOnboarding} variant="teal-outline" fullWidth>
  + Onboard new character
</Button>

// Active scene cast
<SceneCastPanel />
```

### ASSET LIBRARY PANEL (full featured — see priority 6)

### LOCATION PANEL

```tsx
<SearchInput placeholder="Describe or search a location..." onChange={searchLocations} />
<LocationSourceTabs>
  <Tab label="Mapillary" /> // Real-world street photos
  <Tab label="Cesium 3D" /> // Aerial / terrain
  <Tab label="AI Generate" /> // Prompt-generated
  <Tab label="My uploads" />
</LocationSourceTabs>
<LocationResultsGrid />
<PinnedLocations />
<FlightPathBuilder /> // Catmull-Rom spline tool for aerial shots
```

### CAST MANAGER PANEL

```tsx
<SceneCastBuilder
  availableCharacters={characters}
  onAddCharacter={addToScene}
  onSetBlocking={setBlocking}  // foreground/midground/background
  onSetAction={setAction}
/>
<MultiCharacterCostInfo />
```

### SFX MAKEUP PANEL (see priority 7)
### GREEN SCREEN PANEL (see priority 8)
### CGI & 3D PANEL
### VFX LIBRARY PANEL
### TRANSITIONS PANEL
### AUDIO PANEL
### STOCK LIBRARY PANEL
### SCRIPT PANEL
### STORYBOARD PANEL
### AI AVATAR PANEL
### BRAND KIT PANEL

---

## PRIORITY 6 — CHARACTER ONBOARDING FLOW

This is the most important missing feature. Build a step-by-step modal that walks users through creating a complete character vault entry.

### `src/components/vault/CharacterOnboarding.tsx`

A full-screen step-by-step wizard modal. 6 steps.

**Step 1 — Identity**
```tsx
<h2>Who is this character?</h2>
<input placeholder="Character name" />
<textarea placeholder="Physical description: age, build, hair, eyes, distinguishing features..." />
<RoleSelector options={['Lead', 'Supporting', 'Featured', 'Background', 'Voice only']} />
```

**Step 2 — Face References (most important step)**
```tsx
<h2>Upload face references</h2>
<p>5–20 photos for best LoRA training. Include: front, 3/4, profile, different lighting, different expressions.</p>
<MultiImageUpload
  minFiles={3}
  maxFiles={20}
  onUpload={handleFaceRefs}
  showQualityScore={true}  // AI scores each upload for suitability
/>
<ReferenceQualityGuide />  // Shows good vs bad reference examples
<FaceExtractionPreview />  // Shows detected face bounding boxes
```

**Step 3 — Appearance & Costume**
```tsx
<h2>Default appearance</h2>
<CostumeBuilder>
  <input placeholder="Outfit description" />
  <ColorPaletteInput label="Key colours" />
  <ImageUpload label="Costume reference photo" />
</CostumeBuilder>
```

**Step 4 — Makeup & SFX State**
```tsx
<h2>Default makeup state</h2>
<MakeupTypeSelector options={['Clean', 'Beauty', 'SFX', 'Mixed']} />
<MakeupEffectBuilder />  // Add effects from the full taxonomy
// This is where characters can have dirt, blood, scars as their DEFAULT state
```

**Step 5 — Voice**
```tsx
<h2>Voice</h2>
<VoiceSetupTabs>
  <Tab label="Clone from recording">
    <AudioRecorder minSeconds={30} label="Record 30+ seconds of dialogue" />
    <AudioUpload label="Or upload audio file" />
    <VoicePreview />
  </Tab>
  <Tab label="Choose preset">
    <VoiceLibraryGrid />  // Browse ElevenLabs voices
  </Tab>
  <Tab label="No voice">
    <p>Character will be silent — voice added separately</p>
  </Tab>
</VoiceSetupTabs>
<VoiceSettings>
  <Slider label="Pitch" />
  <Slider label="Speed" />
  <EmotionBaseline />
</VoiceSettings>
```

**Step 6 — Model & Confirm**
```tsx
<h2>Generation settings</h2>
<ModelFamilySelector
  label="Preferred model family"
  note="This character will be locked to this model family for consistency"
  options={['Auto (recommended)', 'Seedance 2.0', 'Kling 3.0', 'SkyReels V1', 'Runway Gen-4.5']}
/>
<CharacterSummaryCard character={draftCharacter} />
<LoRATrainingToggle
  label="Start LoRA training now"
  note="Uses 60 credits. Unlocks after 10 scenes. Dramatically improves consistency."
  available={faceRefs.length >= 10}
/>
<Button variant="teal" onClick={saveCharacter}>Create character</Button>
```

After saving: character appears in vault with a "Training" status badge if LoRA was triggered. Progress indicator shows training completion percentage.

---

## PRIORITY 7 — SFX MAKEUP PANEL (full implementation)

### `src/components/panels/SFXMakeupPanel.tsx`

Accessible from: icon rail → makeup icon, character card → makeup button, clip properties → SFX makeup section.

```tsx
// HEADER
<CharacterSelector label="Apply to character" />
<ApplicationModeToggle>
  <Mode value="pre_gen" label="Pre-generation" note="Baked into prompt — free" />
  <Mode value="post_gen" label="Post-generation" note="Applied after — 4 credits" />
  <Mode value="reference" label="From reference image" note="Match a photo — 5 credits" />
</ApplicationModeToggle>

// NATURAL LANGUAGE REQUEST (fastest method)
<textarea placeholder='Describe any effect naturally: "she was in a fire", "battle-worn soldier with 3-day stubble and a healing scar", "fresh from a car crash"...' />
<Button onClick={interpretRequest}>Interpret & Apply</Button>

// OR — MANUAL BUILDER
<MakeupEffectBuilder>
  <CategoryGrid>
    // BEAUTY
    <EffectCategory label="Beauty" icon="beauty">
      <EffectButton type="foundation" />
      <EffectButton type="eye_makeup" />
      <EffectButton type="lip_color" />
      <EffectButton type="hair_styling" />
    </EffectCategory>

    // BLOOD & WOUNDS
    <EffectCategory label="Blood & Wounds" icon="wounds">
      <EffectButton type="blood_fresh" preview="bright red, wet" />
      <EffectButton type="blood_dried" preview="dark, crusted" />
      <EffectButton type="blood_arterial" preview="spray pattern" />
      <EffectButton type="wound_cut" />
      <EffectButton type="wound_laceration" />
      <EffectButton type="wound_puncture" />
      <EffectButton type="wound_gunshot" />
      <EffectButton type="wound_stab" />
    </EffectCategory>

    // BURNS
    <EffectCategory label="Burns" icon="fire">
      <EffectButton type="burn_first_degree" preview="red, irritated" />
      <EffectButton type="burn_second_degree" preview="blistered" />
      <EffectButton type="burn_third_degree" preview="charred, leathery" />
      <EffectButton type="burn_chemical" />
      <EffectButton type="burn_electrical" />
    </EffectCategory>

    // BRUISING
    <EffectCategory label="Bruising" icon="bruise">
      <EffectButton type="bruise_fresh" preview="red, forming" />
      <EffectButton type="bruise_24hr" preview="purple-blue" />
      <EffectButton type="bruise_healing" preview="yellow-green" />
      <EffectButton type="bruise_old" preview="fading yellow" />
    </EffectCategory>

    // SCARS
    <EffectCategory label="Scars" icon="scar">
      <EffectButton type="scar_healed" />
      <EffectButton type="scar_keloid" />
      <EffectButton type="scar_surgical" />
      <EffectButton type="scar_battle" />
    </EffectCategory>

    // DIRT & GRIME
    <EffectCategory label="Dirt & Grime" icon="dirt">
      <EffectButton type="dirt_general" />
      <EffectButton type="dirt_mud" />
      <EffectButton type="ash_fire" />
      <EffectButton type="ash_volcanic" />
      <EffectButton type="grease_mechanical" />
      <EffectButton type="oil_motor" />
      <EffectButton type="sweat_heavy" />
      <EffectButton type="sweat_exhaustion" />
    </EffectCategory>

    // DISEASE & CONDITION
    <EffectCategory label="Disease & Condition" icon="disease">
      <EffectButton type="pallor_sick" />
      <EffectButton type="pallor_death" />
      <EffectButton type="infection_wound" />
      <EffectButton type="necrosis" />
      <EffectButton type="jaundice" />
      <EffectButton type="tearstains" />
    </EffectCategory>

    // SPECIAL
    <EffectCategory label="Special & Age" icon="special">
      <EffectButton type="age_10yr" />
      <EffectButton type="age_20yr" />
      <EffectButton type="age_40yr" />
      <EffectButton type="undead_zombie" />
      <EffectButton type="alien_texture" />
      <EffectButton type="tattoo_custom" />
    </EffectCategory>
  </CategoryGrid>

  // ACTIVE EFFECTS LIST
  {activeEffects.map(effect => (
    <EffectRow key={effect.id}>
      <EffectLabel>{effect.category}</EffectLabel>
      <LocationSelector value={effect.location} onChange={...} />
      <IntensitySlider value={effect.intensity} onChange={...} />
      <RemoveButton />
    </EffectRow>
  ))}
</MakeupEffectBuilder>

// PROGRESSION
<ProgressionBuilder
  label="Damage progression"
  note="Generate multiple states of increasing damage across a scene"
  steps={5}
/>

// APPLY
<Button variant="teal" onClick={applyMakeup}>Apply to character</Button>
<Button variant="outline" onClick={saveAsPreset}>Save as preset</Button>
```

---

## PRIORITY 8 — GREEN SCREEN PANEL

### `src/components/panels/GreenScreenPanel.tsx`

```tsx
// SOURCE
<ClipSelector label="Source clip" />

// EXTRACTION MODE
<ExtractionModeSelector>
  <Mode value="chroma_key" label="Chroma key" note="Physical green/blue screen footage" />
  <Mode value="ai_matting" label="AI matting" note="No green screen needed — AI segments subject" />
  <Mode value="depth_matting" label="Depth matting" note="Uses depth map for separation" />
</ExtractionModeSelector>

// Chroma key settings (shown when chroma_key selected)
<ChromaKeySettings>
  <ColorPicker label="Key colour" presets={['green', 'blue', 'custom']} />
  <Slider label="Similarity" min={0} max={100} />
  <Slider label="Blend/spill" min={0} max={100} />
  <Toggle label="Spill suppression" />
  <Slider label="Edge refinement" min={0} max={100} />
</ChromaKeySettings>

// BACKDROP SOURCE
<BackdropSourceSelector>
  <Source value="ai_generated" label="AI Generate">
    <textarea placeholder="Describe the background you want..." />
    <ModelSelector models={['Veo 3.1', 'Wan 2.2', 'Seedance 2.0']} />
    <TimeOfDayPicker />
    <WeatherPicker />
  </Source>
  <Source value="location_vault" label="Location Vault">
    <LocationVaultGrid />
  </Source>
  <Source value="user_uploaded" label="Upload">
    <FileUpload accept="image/*,video/*" />
  </Source>
  <Source value="hdri_environment" label="HDRI">
    <HDRILibraryGrid />
  </Source>
  <Source value="solid_colour" label="Solid colour">
    <ColorPicker />
  </Source>
</BackdropSourceSelector>

// COMPOSITING OPTIONS
<Toggle label="IC-Light: match lighting to backdrop" />
<Toggle label="Depth blur (bokeh background)" />
<Slider label="Blur amount" min={0} max={100} />
<Toggle label="Generate ground shadows" />

<Button variant="teal" onClick={processGreenScreen}>Composite  ·  6 credits</Button>
```

---

## PRIORITY 9 — ASSET LIBRARY (full panel)

### `src/components/panels/AssetLibraryPanel.tsx`

```tsx
<SearchInput placeholder="Search all assets..." />
<AssetTypeTabs>
  <Tab value="generated" label="My generations" />
  <Tab value="stock_video" label="Stock video" />
  <Tab value="stock_music" label="Music" />
  <Tab value="sfx" label="Sound FX" />
  <Tab value="templates" label="Templates" />
  <Tab value="luts" label="LUTs" />
  <Tab value="fonts" label="Fonts" />
  <Tab value="3d_assets" label="3D assets" />
  <Tab value="overlays" label="Overlays" />
</AssetTypeTabs>

// My generations tab
<GeneratedAssetGrid
  assets={userGenerations}
  onDragToTimeline={handleDrop}
  onPreview={openPreview}
  onUseAsReference={attachAsReference}
  showModelBadge
  showCreditCost
/>

// Stock video tab — Pexels/Pixabay
<StockVideoGrid
  onSearch={searchPexels}
  onDragToTimeline={handleDrop}
  showLicence
/>

// Music tab — Suno stems + FMA
<MusicLibraryGrid
  showBPM
  showMood
  onPreview={playPreview}
  onAddToTimeline={addToAudioTrack}
  onGenerateNew={() => openAudioGeneration()}
/>

// SFX tab — curated 500+ effects
<SFXGrid
  categories={['impacts', 'ambience', 'mechanical', 'human', 'nature', 'electronic', 'cinematic']}
  onPreview={playPreview}
  onAddToTimeline={addToSFXTrack}
/>

// Templates tab — motion graphics
<TemplateGrid
  categories={['lower_thirds', 'titles', 'transitions', 'social', 'broadcast', 'UI']}
  onApply={applyTemplate}
  onPreview={previewTemplate}
/>
```

---

## PRIORITY 10 — TIMELINE (COMPLETE REBUILD)

The timeline must show ALL tracks, ALL controls, and be fully interactive.

### `src/components/editor/Timeline.tsx`

```tsx
// TIMELINE TOOLBAR (above the tracks)
<TimelineToolbar>
  <ZoomControls value={zoom} onChange={setZoom} />
  <FitButton onClick={fitToWindow} />
  <Separator />
  <TrackAddButton>
    <MenuItem onClick={() => addTrack('video')}>+ Video track</MenuItem>
    <MenuItem onClick={() => addTrack('audio')}>+ Audio track</MenuItem>
    <MenuItem onClick={() => addTrack('vfx')}>+ VFX track</MenuItem>
    <MenuItem onClick={() => addTrack('cgi')}>+ CGI track</MenuItem>
    <MenuItem onClick={() => addTrack('caption')}>+ Caption track</MenuItem>
  </TrackAddButton>
  <Separator />
  <BeatMarkerToggle />
  <SnapToggle />
  <RippleToggle />
  <LinkedToggle />
</TimelineToolbar>

// STANDARD TRACK SET — always present
const DEFAULT_TRACKS = [
  { id: 'v1',  type: 'video',   label: 'VIDEO 1',  color: 'var(--track-video)',   expandable: true },
  { id: 'v2',  type: 'video',   label: 'VIDEO 2',  color: 'var(--track-video)',   expandable: true },
  { id: 'vfx', type: 'vfx',     label: 'VFX',      color: 'var(--track-vfx)',     expandable: true },
  { id: 'cgi', type: 'cgi',     label: 'CGI',      color: 'var(--track-cgi)',     expandable: true },
  { id: 'mus', type: 'music',   label: 'MUSIC',    color: 'var(--track-music)',   waveform: true },
  { id: 'voi', type: 'voice',   label: 'VOICE',    color: 'var(--track-voice)',   waveform: true },
  { id: 'sfx', type: 'sfx',     label: 'SFX',      color: 'var(--track-sfx)',     waveform: true },
  { id: 'cap', type: 'caption', label: 'CAPTIONS', color: 'var(--track-caption)', expandable: false },
]

// TRACK ROW — each track has:
<TrackRow track={track}>
  <TrackLabel>
    <ColorDot color={track.color} />
    <TrackName editable onClick={editTrackName} />
    <MuteButton />
    <SoloButton />
    <LockButton />
    {track.type === 'audio' && <VolumeKnob />}
    {track.type === 'video' && <VisibilityToggle />}
    <ExpandButton />
  </TrackLabel>
  <TrackContent>
    {clips.map(clip => (
      <Clip
        key={clip.id}
        clip={clip}
        selected={selectedClipId === clip.id}
        generating={generatingJobIds.has(clip.jobId)}
        onClick={() => selectClip(clip.id)}
        onContextMenu={openClipContextMenu}
        onDragEnd={handleClipReposition}
        onTrimLeft={handleTrimLeft}
        onTrimRight={handleTrimRight}
      />
    ))}
    <GenerateZone
      onClick={(timestamp) => openGenerateAtTimestamp(timestamp)}
      onDrop={handleDrop}
    />
  </TrackContent>
</TrackRow>

// CLIP right-click context menu — MUST include ALL of these:
<ContextMenu>
  <MenuItem icon="repaint"    label="Repaint segment"        shortcut="R"  onClick={openRepaint} />
  <MenuItem icon="recast"     label="Recast character"                     onClick={openRecast} />
  <MenuItem icon="makeup"     label="Apply SFX makeup"                     onClick={openMakeup} />
  <MenuItem icon="relight"    label="Relight (IC-Light)"                   onClick={openRelight} />
  <MenuItem icon="extend"     label="Extend clip..."                       onClick={openExtend} />
  <MenuItem icon="upscale"    label="Upscale..."                           onClick={openUpscale} />
  <MenuItem icon="translate"  label="Translate & dub..."                   onClick={openTranslate} />
  <MenuItem icon="greenscreen" label="Green screen composite..."           onClick={openGreenScreen} />
  <MenuItem icon="retime"     label="Retime / slow motion..."              onClick={openRetime} />
  <Separator />
  <MenuItem icon="duplicate"  label="Duplicate"              shortcut="D" />
  <MenuItem icon="split"      label="Split at playhead"      shortcut="S" />
  <MenuItem icon="delete"     label="Delete"                 shortcut="Del" />
  <Separator />
  <MenuItem icon="properties" label="Clip properties"                      onClick={openProperties} />
  <MenuItem icon="send-to-library" label="Send to asset library" />
</ContextMenu>
```

---

## PRIORITY 11 — RIGHT PANEL (COMPLETE PROPERTIES)

The right panel must show ALL properties for the selected clip and never be empty.

### `src/components/panels/RightPanel.tsx`

```tsx
// When no clip selected: show PROJECT SETTINGS
<ProjectSettings>
  <FPSSelector options={[24, 30, 60]} />
  <ResolutionPicker />
  <ColourSpaceSelector options={['Rec.709', 'DCI-P3', 'Rec.2020']} />
  <DurationDisplay />
  <AspectRatioDisplay />
</ProjectSettings>

// When clip selected: show CLIP PROPERTIES in tabs
<ClipPropertiesTabs>
  <Tab label="Properties">
    <ClipName editable />
    <ModelBadge model={clip.modelUsed} />
    <DurationDisplay start={clip.startTime} end={clip.endTime} />
    <PromptField value={clip.prompt} editable note="Editing prompt shows regeneration warning" />
    
    // REPAINT — most prominent action
    <ActionButton variant="teal" icon="repaint" onClick={openRepaint}>
      Repaint Segment
    </ActionButton>
    
    // CHARACTER
    {clip.characterIds?.length > 0 && (
      <CharacterInfo character={getCharacter(clip.characterIds[0])} />
    )}
  </Tab>

  <Tab label="Lighting">
    <LightingPanel>
      <EnvironmentPresets>
        {['Natural day', 'Golden hour', 'Night / neon', 'Overcast', 'Studio', 'Candlelight', 'Underwater'].map(preset => (
          <PresetButton key={preset} onClick={() => applyLightingPreset(preset)} />
        ))}
      </EnvironmentPresets>
      <Slider label="Temperature" min={2000} max={8000} unit="K" />
      <Slider label="Intensity" min={0} max={200} unit="%" />
      <Button onClick={relightWithIC}>Apply IC-Light  ·  2 credits</Button>
    </LightingPanel>
  </Tab>

  <Tab label="Colour">
    <ColourGradePanel>
      <FilmEmulationPicker presets={['Kodak 5219', 'Fuji 3510', 'Kodak 2383', 'B&W Contrast', 'None']} />
      <LUTImport onImport={handleLUTImport} />
      <ASCCDLControls />
      <Sliders>
        <Slider label="Temperature" />
        <Slider label="Tint" />
        <Slider label="Exposure" />
        <Slider label="Contrast" />
        <Slider label="Saturation" />
        <Slider label="Shadows" />
        <Slider label="Highlights" />
      </Sliders>
      <Toggle label="Harmonise with adjacent clips" />
    </ColourGradePanel>
  </Tab>

  <Tab label="Effects">
    <EffectsPanel>
      <ActiveEffects effects={clip.effects} onRemove={removeEffect} onAdjust={adjustEffect} />
      <AddEffectDropdown categories={['Rain', 'Snow', 'Fog', 'Film grain', 'Halation', 'Vignette', 'Lens flare', 'Bloom', 'Glitch', 'Lightning', 'Fire', 'Smoke', 'Particles', 'Blur', 'Chromatic aberration']} />
    </EffectsPanel>
  </Tab>

  <Tab label="Audio">
    <AudioPanel>
      <VolumeSlider />
      <PanSlider />
      <EQSection bands={3} />
      <FadeIn duration={fadeIn} onChange={setFadeIn} />
      <FadeOut duration={fadeOut} onChange={setFadeOut} />
      <Toggle label="Studio Sound enhance" />
    </AudioPanel>
  </Tab>

  <Tab label="Transform">
    <TransformPanel>
      <NumberInput label="X position" />
      <NumberInput label="Y position" />
      <NumberInput label="Scale" unit="%" />
      <NumberInput label="Rotation" unit="°" />
      <Slider label="Opacity" min={0} max={100} />
      <KenBurnsEditor visible={isStaticImage(clip)} />
    </TransformPanel>
  </Tab>
</ClipPropertiesTabs>

// UPSCALE section (always shown)
<UpscaleSection>
  <UpscaleFactorPicker options={['2x', '4x', '8x']} />
  <EngineInfo engine={recommendedEngine} />
  <Toggle label="Face enhance (CodeFormer)" />
  <Toggle label="Preserve film grain" />
  <Button onClick={upscaleClip}>Upscale  ·  <UpscaleCost /></Button>
</UpscaleSection>
```

---

## PRIORITY 12 — ULTIMATE MODE PANELS (wire up ALL studio tools)

In Ultimate mode, the following panels must be accessible from the toolbar:

### AI DIRECTOR PANEL (`src/components/studio/AIDirectorPanel.tsx`)
```tsx
<h2>AI Director</h2>
<textarea placeholder="Creative brief: genre, tone, characters, premise..." rows={5} />
<StylePicker options={['Noir thriller', 'Epic action', 'Heartwarming drama', 'Documentary', 'Sci-Fi', 'Horror', 'Comedy', 'Custom']} />
<DurationSlider min={30} max={600} unit="seconds" />
<CharacterMultiSelect characters={vaultCharacters} />
<LocationMultiSelect locations={vaultLocations} />
<TierSelector value={tier} onChange={setTier} />
<CostEstimate />
<Button variant="teal" onClick={runAIDirector}>
  Direct my film  ·  From 50 credits
</Button>
```

### COLOUR GRADING PANEL (`src/components/studio/ColourGradingPanel.tsx`)
```tsx
// Full DaVinci-class colour tool
<ColourWheels lift={lift} gamma={gamma} gain={gain} onChange={...} />
<Scopes>
  <WaveformScope />
  <VectorScope />
  <HistogramScope />
</Scopes>
<FilmEmulationPresets />
<LUTManager onImport={importLUT} onRemove={removeLUT} />
<ColourSpaceSelector />
<HDRControls />
<Button onClick={harmoniseAll}>Harmonise all clips (IC-Light)</Button>
```

### AUDIO MIXER PANEL (`src/components/studio/AudioMixerPanel.tsx`)
```tsx
// One fader per audio track
{audioTracks.map(track => (
  <ChannelStrip key={track.id}>
    <ChannelLabel>{track.label}</ChannelLabel>
    <VolumeFader value={track.volume} onChange={...} />
    <PanKnob value={track.pan} onChange={...} />
    <EQStrip bands={3} />
    <CompressorToggle />
    <MuteSoloButtons />
  </ChannelStrip>
))}
<MasterBus>
  <MasterFader />
  <CompressorToggle label="Master compressor" />
  <LimiterToggle />
  <DolbyAtmosToggle />
</MasterBus>
<FoleyGenerator>
  <textarea placeholder="Generate foley: describe ambient sound..." />
  <Button onClick={generateFoley}>Generate  ·  4 credits</Button>
</FoleyGenerator>
```

### VFX COMPOSITOR PANEL (`src/components/studio/VFXCompositorPanel.tsx`)
```tsx
<VFXLayerList layers={vfxLayers} onReorder={reorderLayers} />
{selectedLayer && (
  <LayerProperties>
    <BlendModeSelector modes={['Normal', 'Screen', 'Multiply', 'Add', 'Overlay', 'Difference']} />
    <Slider label="Opacity" />
    <MaskTools>
      <RectangularMask />
      <EllipticalMask />
      <FreehandMask />
      <LuminanceMask />
      <ChromaKeyMask />
    </MaskTools>
  </LayerProperties>
)}
<AddVFXButton>
  <VFXCategoryGrid
    categories={['Weather', 'Fire & explosion', 'Particles', 'Optical FX', 'Motion FX', 'Practical SFX']}
    onSelect={addVFXLayer}
  />
  <GenerateCustomVFX>
    <textarea placeholder="Describe custom VFX effect..." />
    <Button onClick={generateVFX}>Generate VFX</Button>
  </GenerateCustomVFX>
</AddVFXButton>
```

### CGI INSERTION PANEL (`src/components/studio/CGIInsertionPanel.tsx`)
```tsx
<h3>Insert 3D object</h3>
<textarea placeholder='Describe the 3D object: "a hovering drone above the building", "a vintage red car"...' />
<FrameRangePicker start={cgiStart} end={cgiEnd} />
<AttachmentPicker label="Attach to surface" note="Click a point on the preview frame" />
<Toggle label="Auto-match scene lighting" />
<RenderQualityPicker options={['Draft (fast)', 'Final (accurate)']} />
<Button onClick={insertCGI}>Generate & Insert  ·  25 credits</Button>
```

### CONTINUITY CHECKER (`src/components/studio/ContinuityChecker.tsx`)
```tsx
<Button onClick={runContinuityCheck} variant="teal">
  Run continuity check  ·  5 credits
</Button>
{continuityIssues.map(issue => (
  <IssueCard key={issue.id} severity={issue.severity}>
    <IssueBadge type={issue.type} />
    <IssueDescription>{issue.description}</IssueDescription>
    <JumpToButton clipId={issue.clips[0]} />
    <SuggestionText>{issue.suggestion}</SuggestionText>
  </IssueCard>
))}
```

---

## PRIORITY 13 — FILM MODE & SERIES MODE

### Film Mode layout

When a FilmProject is open, the script panel shows the Fountain editor:

```tsx
<ScriptPanel>
  <ScriptToolbar>
    <Button onClick={parseScript}>Parse → Shot list</Button>
    <Button onClick={generateStoryboard}>Storyboard</Button>
    <Button onClick={generateAllShots}>Produce all scenes</Button>
  </ScriptToolbar>
  <FountainEditor
    value={scriptText}
    onChange={setScriptText}
    highlightCharacters={true}
    autoFormatHeadings={true}
    showSceneNumbers={true}
  />
  <SceneBreakdownSidebar scenes={parsedScenes} />
</ScriptPanel>
```

### Series Mode navigation
```tsx
<SeriesNavigator>
  <SeriesBible />
  <SeasonGrid seasons={series.seasons} />
  <EpisodeGrid episodes={selectedSeason.episodes} />
  <EpisodeProducer episode={selectedEpisode} />
</SeriesNavigator>
```

---

## PRIORITY 14 — SIMPLE MODE (complete overhaul)

The Simple Mode must feel like a consumer product — clean, welcoming, zero learning curve.

```tsx
// Hero section
<HeroInput
  placeholder="Describe your video... The AI will handle everything"
  onSubmit={handleSimpleGenerate}
  large
/>

// Quick options (single row)
<QuickOptions>
  <QualityPills />
  <DurationPicker />
  <AspectRatioPicker />
</QuickOptions>

// Tabs for different generation types
<GenerationTypeTabs>
  <Tab value="text_to_video" label="Text to video" icon="text" />
  <Tab value="image_to_video" label="Image to video" icon="image" />
  <Tab value="audio_to_video" label="Audio to video" icon="music" />
  <Tab value="auto_social" label="Drop & Direct" icon="social" />
  <Tab value="avatar_video" label="Avatar video" icon="avatar" />
  <Tab value="translate" label="Translate & dub" icon="translate" />
  <Tab value="highlights" label="Extract highlights" icon="highlights" />
  <Tab value="slides_to_video" label="Slides to video" icon="slides" />
</GenerationTypeTabs>

// Drop & Direct tab
<AutoSocialPanel>
  <DropZone
    maxFiles={30}
    accept="video/*,image/*"
    label="Drop up to 30 photos & videos here"
    sublabel="AI will sort, score, and cut them into compelling social content"
  />
  {droppedAssets.length > 0 && (
    <>
      <DroppedAssetGrid assets={droppedAssets} />
      <PlatformSelector />
      <Button variant="teal" onClick={runAutoSocial}>Generate content  ·  10 credits</Button>
    </>
  )}
</AutoSocialPanel>
```

---

## PRIORITY 15 — SPECIFIC UI FIXES FROM SCREENSHOT

Looking at the current screenshot, fix these specific issues:

1. **The timeline track labels are truncated** — "VID...", "MU...", "VOL..." etc. Expand the label column to 80px minimum. Show full labels.

2. **The right panel only shows FPS/Colour Space** — This is only for empty timeline. When a clip is selected, all properties tabs must appear immediately.

3. **The toolbar icons are minimal** — The toolbar between mode tabs and the timeline only shows a zoom slider and play button. Add ALL toolbar buttons specified above.

4. **The script panel overlaps timeline** — Script should be a left panel toggle, not a persistent overlay splitting the screen. When script is not active, the full timeline width should be available for video preview + timeline.

5. **CGI, Continuity, Audio Mix buttons in top bar** — These should be in the toolbar row, not isolated. Also add: SFX, Green Screen, Cast, Colour Grade, AI Director buttons.

6. **The "1 Issue" badge** — This is likely a Cursor error indicator. For the CINÉMA app itself, show a "1 continuity issue" badge in the Continuity toolbar button when issues are detected.

7. **Preview area** — Currently shows "No content at playhead" with a light grey background. Change to a dark environment with a teal-accent border and a generate-first call-to-action when timeline is empty.

8. **Project settings on right** — Move project settings (FPS, Colour Space, Duration) to a collapsed section within the right panel header — not as the default right panel content.

---

## PRIORITY 16 — COMPLETE STYLE OVERHAUL (specific CSS)

Apply these styles globally. Create `src/styles/cinema-theme.css`:

```css
/* Backgrounds */
.app-shell { background: var(--bg-base); }
.icon-rail { background: var(--bg-elevated); border-right: 1px solid var(--border); }
.left-panel { background: var(--bg-elevated); border-right: 1px solid var(--border); }
.right-panel { background: var(--bg-elevated); border-left: 1px solid var(--border); }
.top-bar { background: var(--bg-elevated); border-bottom: 1px solid var(--border); }
.timeline-area { background: #0a0f18; }
.preview-area { background: #06090f; }
.track-label-col { background: #10151f; border-right: 1px solid var(--border); }

/* Text legibility — critical fix */
.panel-label { font-size: 10px; font-weight: 600; letter-spacing: 0.7px; color: var(--text-tertiary); }
.panel-heading { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.clip-title { font-size: 11px; font-weight: 500; color: var(--text-primary); }
.clip-model { font-size: 9px; color: var(--text-secondary); }
.track-name { font-size: 10px; font-weight: 600; color: var(--text-secondary); }

/* Neon teal accent — applied everywhere amber was */
.accent-button { background: var(--teal-bright); color: #03080e; font-weight: 600; }
.accent-button:hover { background: #00f0d5; }
.accent-border { border-color: var(--teal-bright) !important; }
.accent-text { color: var(--teal-bright); }
.active-icon { background: var(--teal-glow); border: 1px solid var(--teal-border); color: var(--teal-bright); }
.selected-clip { border: 1.5px solid var(--teal-bright) !important; box-shadow: 0 0 8px var(--teal-glow); }
.generating-clip { border: 1.5px dashed var(--teal-dark) !important; }
.progress-bar { background: var(--teal-bright); }
.credit-display { color: var(--teal-bright); }
.lora-ready-badge { background: var(--teal-glow); color: var(--teal-bright); border: 1px solid var(--teal-border); }

/* Mode tabs */
.mode-tab.active { background: var(--teal-glow); color: var(--teal-bright); border: 1px solid var(--teal-border); }

/* Quality tier indicator */
.tier-blockbuster { color: var(--teal-bright); border-color: var(--teal-border); }
.tier-studio { color: #00b8a0; }
.tier-standard { color: var(--text-secondary); }
.tier-draft { color: var(--text-tertiary); }

/* Timeline */
.playhead { background: var(--teal-bright); }
.playhead-arrow { border-top-color: var(--teal-bright); }
.beat-marker { background: rgba(0, 229, 200, 0.3); }
.time-ruler { background: #080c14; }

/* Buttons */
button[data-variant="teal"] {
  background: var(--teal-bright);
  color: #03080e;
  font-weight: 600;
  border: none;
}
button[data-variant="teal-outline"] {
  background: transparent;
  color: var(--teal-bright);
  border: 1px solid var(--teal-border);
}
button[data-variant="teal"]:hover { background: #00f0d5; }

/* Inputs */
input, textarea, select {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  color: var(--text-primary);
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 12px;
}
input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--teal-dark);
  box-shadow: 0 0 0 2px var(--teal-glow);
}

/* Scrollbars */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bg-active); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--teal-dark); }
```

---

## PRIORITY 17 — WIRING CHECKLIST

Every button, option, and control must call a real function. If the backend function doesn't exist yet, create a stub that shows a toast notification "Feature generating — check back soon" but NEVER leave a button that does nothing silently.

Go through this checklist and verify each item is wired:

**Generate panel:**
- [ ] Prompt textarea → calls decompose API on submit
- [ ] Quality pills → updates tier state → updates cost display
- [ ] Duration picker → updates generation params
- [ ] Aspect ratio → updates params
- [ ] Camera sliders → updates cameraDirectorSettings state
- [ ] Generate button → POSTs to /api/swarm/decompose then /api/swarm/dispatch
- [ ] SSE stream → updates generating clip with progress

**Character vault:**
- [ ] "Onboard new character" button → opens CharacterOnboarding modal
- [ ] Character card "Edit" → opens onboarding in edit mode
- [ ] Character card "Makeup" → opens SFXMakeupPanel with character pre-selected
- [ ] Character card "Voice" → opens voice vault editor
- [ ] LoRA status badge → shows training progress or triggers training

**Timeline:**
- [ ] Playhead drag → updates currentTime
- [ ] Clip click → selects clip, populates right panel
- [ ] Clip drag → repositions in timeline
- [ ] Clip trim handles → resizes clip
- [ ] Track mute → mutes audio/hides video
- [ ] Track solo → solos the track
- [ ] Right-click clip → shows full context menu (15 items)
- [ ] "Repaint" in context menu → opens RepaintModal
- [ ] "Recast" in context menu → opens RecasterPanel
- [ ] Empty timeline area click → opens generate at timestamp

**Right panel:**
- [ ] Repaint button → opens RepaintModal
- [ ] IC-Light slider drag → calls relightScene preview
- [ ] Apply IC-Light button → calls relighting API
- [ ] LUT import → uploads and applies LUT
- [ ] Film emulation picker → applies preset grade
- [ ] Add effect dropdown → adds to clip.effects
- [ ] Upscale button → calls upscaling API

**Top bar:**
- [ ] Export Film → opens ExportDialog
- [ ] AI Director button → opens AIDirectorPanel
- [ ] Storyboard button → opens StoryboardPanel
- [ ] Continuity button → opens ContinuityChecker
- [ ] Cast button → opens CastManagerPanel
- [ ] Mode switcher → changes mode, shows/hides relevant panels
- [ ] Credits display → opens purchase modal

---

## FINAL MANDATE

After implementing all of the above:

1. Do a full audit of the left panel. Every icon in the rail must open a populated, functional panel.
2. Do a full audit of the right panel. No empty states — every state must show relevant controls.
3. Do a full audit of the timeline context menu. All 15 items must call real functions.
4. Do a full audit of the top bar. Every button must work.
5. Check every modal/overlay is dismissable with Escape key.
6. Check every credit cost is displayed before an action fires.
7. Check the neon teal is consistent — no remaining amber/yellow anywhere.
8. Check the text is legible at every size — minimum contrast ratio 4.5:1 against backgrounds.

The result must look and feel like the most capable video production software ever built, while remaining intuitive enough that a first-time user can generate their first clip within 60 seconds of opening the app.
