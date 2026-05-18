# CINÉMA — THREE SPECIFIC BUGS TO FIX NOW
## Cursor Prompt: Targeted fixes based on screenshot analysis

> DO NOT rewrite large systems. DO NOT refactor. Find the specific broken connections and wire them. Three bugs, three fixes.

---

## BUG 1 — AUTH ERROR (Fix first — it breaks the app on load)

**The error:** `Console ClientFetchError: The string did not match the expected pattern`
**URL:** `https://errors.authjs.dev#autherror`
**Cause:** NextAuth is trying to fetch the session but `NEXTAUTH_URL` or `NEXTAUTH_SECRET` is missing or malformed in the environment.

### Fix — Option A: Set the environment variables (preferred)

In `.env.local`, ensure these exist exactly:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any-random-32-character-string-here
```

Generate a valid secret by running:
```bash
openssl rand -base64 32
```
Paste the output as `NEXTAUTH_SECRET`. Restart the dev server after adding.

### Fix — Option B: Disable auth requirement for development (fastest)

Find the NextAuth configuration file. It will be at one of:
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/lib/auth.ts`
- `src/lib/auth/options.ts`

In that file, find the providers array. If Google OAuth is configured but credentials aren't set, replace or add a simple credentials provider for local dev:

```typescript
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Dev Login',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Dev bypass — accept any login locally
        if (process.env.NODE_ENV === 'development') {
          return {
            id: 'dev-user-001',
            email: credentials?.email || 'dev@cinema.local',
            name: 'Dev User',
            role: 'STUDIO',
            creditBalance: 99999,
          }
        }
        return null
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-cinema-local',
  session: { strategy: 'jwt' as const },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}

export default NextAuth(authOptions)
```

### Fix — Option C: Make auth completely optional for unauthenticated routes

Find `middleware.ts` in the root or `src/` directory. If it's blocking all routes requiring auth, change it to only protect specific routes:

```typescript
export { default } from 'next-auth/middleware'

export const config = {
  // Only protect these routes — let the editor work without auth
  matcher: [
    '/api/credits/:path*',
    '/api/vault/:path*',
    '/settings/:path*',
    // Remove /api/jobs/:path* for now so generation works without login
  ],
}
```

---

## BUG 2 — TOP FILM TOOLBAR BUTTONS DON'T CHANGE LEFT PANEL CONTENT

**What the screenshots show:**
- Image 3: "AI Director" tab is highlighted/active in the top toolbar
- Image 4: "Cast" tab is highlighted/active in the top toolbar
- In BOTH cases: the left panel still shows the Script content
- Conclusion: the state that controls visual highlight is NOT the same state the left panel reads from, OR the panel switch logic isn't implemented

### Step 1 — Find the toolbar state

Search the codebase:
```bash
grep -r "activeTab\|filmTab\|activeFilmTab\|selectedTab\|Script.*Storyboard\|AI Director" src/ --include="*.tsx" --include="*.ts" -l
```

Open each file found. Look for where clicking "AI Director", "Cast", etc. updates state. It will look something like:
```typescript
// Could be useState, could be Zustand
const [activeTab, setActiveTab] = useState('script')
// or
setActiveTab('ai_director')
```

Note the EXACT variable name and where it lives.

### Step 2 — Find where the left panel renders content

Search:
```bash
grep -r "activeTab\|filmTab\|SCRIPT\|ScriptPanel\|activePanel" src/ --include="*.tsx" -l
```

Find the component that renders the left panel. It might be:
- A component called `LeftPanel`, `SidePanel`, `MainPanel`  
- Or it might be inline in the main editor layout

Look for a conditional like:
```tsx
{activeTab === 'script' && <ScriptPanel />}
```

### Step 3 — Connect them

The problem is one of these:

**Problem A:** The toolbar button updates state but the panel doesn't read from it
```tsx
// BROKEN: toolbar updates 'activeFilmTab', panel reads 'activeLeftPanel'
// toolbar does: setActiveFilmTab('ai_director')
// panel reads: activeLeftPanel  ← different variable!

// FIX: make them use the same variable
// Change the panel content switcher to read from activeFilmTab:
{activeFilmTab === 'script' && <ScriptPanel />}
{activeFilmTab === 'storyboard' && <StoryboardPanel />}
{activeFilmTab === 'ai_director' && <AIDirectorPanel />}
{activeFilmTab === 'continuity' && <ContinuityPanel />}
{activeFilmTab === 'cast' && <CastManagerPanel />}
{activeFilmTab === 'locations' && <LocationPanel />}
```

**Problem B:** The toolbar button updates state, panel reads same state, but conditional is wrong
```tsx
// BROKEN example:
{activeTab === 'Script' && <ScriptPanel />}  // capital S
// toolbar sets: setActiveTab('script')       // lowercase s — never matches!

// FIX: make values consistent, all lowercase:
{activeTab === 'script' && <ScriptPanel />}
```

**Problem C:** The panel content is hardcoded and never conditionally renders
```tsx
// BROKEN:
<div className="left-panel">
  <ScriptPanel />  {/* always shows, no condition */}
</div>

// FIX: wrap in conditions
<div className="left-panel">
  {activeTab === 'script' && <ScriptPanel />}
  {activeTab === 'ai_director' && <AIDirectorPanel />}
  {activeTab === 'cast' && <CastManagerPanel />}
  {/* etc */}
</div>
```

### Step 4 — Verify the AIDirectorPanel and CastManagerPanel exist

If the conditionals are correct but the panels don't exist yet, create minimal versions:

```tsx
// src/components/panels/AIDirectorPanel.tsx
export function AIDirectorPanel() {
  return (
    <div style={{ padding: '12px', color: '#e8edf5' }}>
      <div style={{ fontSize: '10px', color: '#4a5a78', fontWeight: 700, letterSpacing: '0.7px', marginBottom: '12px' }}>
        AI DIRECTOR
      </div>
      <textarea
        style={{
          width: '100%', background: '#1e2636', border: '1px solid #2a3a58',
          borderRadius: '6px', padding: '8px', color: '#e8edf5', fontSize: '12px',
          resize: 'vertical', minHeight: '80px', boxSizing: 'border-box'
        }}
        placeholder="Creative brief: genre, tone, characters, premise..."
      />
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#4a5a78' }}>Style</div>
      <select style={{ width: '100%', background: '#1e2636', border: '1px solid #2a3a58', color: '#e8edf5', borderRadius: '4px', padding: '5px', marginTop: '4px', fontSize: '11px' }}>
        <option>Noir Thriller</option>
        <option>Epic Action</option>
        <option>Drama</option>
        <option>Documentary</option>
        <option>Sci-Fi</option>
        <option>Horror</option>
        <option>Comedy</option>
      </select>
      <button style={{
        marginTop: '12px', width: '100%', padding: '8px',
        background: '#00e5c8', color: '#03080e', fontWeight: 700,
        border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
      }}>
        Direct This Film
      </button>
    </div>
  )
}
```

```tsx
// src/components/panels/CastManagerPanel.tsx
import { useState } from 'react'

export function CastManagerPanel() {
  const [characters, setCharacters] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')

  return (
    <div style={{ padding: '12px', color: '#e8edf5' }}>
      <div style={{ fontSize: '10px', color: '#4a5a78', fontWeight: 700, letterSpacing: '0.7px', marginBottom: '12px' }}>
        CAST MANAGER
      </div>

      <button
        onClick={() => setShowAdd(true)}
        style={{
          width: '100%', padding: '8px', background: 'transparent',
          border: '1px solid rgba(0,229,200,0.3)', color: '#00e5c8',
          borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginBottom: '10px'
        }}
      >
        + Add character
      </button>

      {showAdd && (
        <div style={{ background: '#1e2636', border: '1px solid #2a3a58', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', color: '#8a9bbf', marginBottom: '6px' }}>Character name</div>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Maya, Alex..."
            autoFocus
            style={{
              width: '100%', background: '#0d1117', border: '1px solid #2a3a58',
              color: '#e8edf5', borderRadius: '4px', padding: '6px 8px',
              fontSize: '12px', boxSizing: 'border-box', marginBottom: '8px'
            }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => {
                if (newName.trim()) {
                  setCharacters(c => [...c, { id: Date.now(), name: newName.trim(), role: 'Supporting' }])
                  setNewName('')
                  setShowAdd(false)
                }
              }}
              style={{ flex: 1, padding: '6px', background: '#00e5c8', color: '#03080e', fontWeight: 700, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
            >
              Add
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewName('') }}
              style={{ padding: '6px 10px', background: '#1e2636', color: '#8a9bbf', border: '1px solid #2a3a58', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {characters.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#4a5a78', fontSize: '11px' }}>
          No characters yet.<br />Add characters to maintain<br />consistency across scenes.
        </div>
      )}

      {characters.map(char => (
        <div key={char.id} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px', background: '#1e2636', borderRadius: '6px',
          border: '1px solid #2a3a58', marginBottom: '6px'
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '4px', background: '#0d1117',
            border: '1px solid rgba(0,229,200,0.3)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '13px', color: '#8a9bbf', flexShrink: 0
          }}>
            {char.name[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: '#e8edf5' }}>{char.name}</div>
            <div style={{ fontSize: '10px', color: '#4a5a78' }}>{char.role} · No LoRA yet</div>
          </div>
          <button
            onClick={() => setCharacters(c => c.filter(x => x.id !== char.id))}
            style={{ background: 'none', border: 'none', color: '#4a5a78', cursor: 'pointer', fontSize: '14px' }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
```

Create similar minimal panels for every missing tab:
- `StoryboardPanel` — shows "Storyboard panel" + a generate button
- `ContinuityPanel` — shows "Continuity check" + a run button
- `LocationPanel` — shows "Location search" input + placeholder results

---

## BUG 3 — LEFT ICON RAIL DOES NOTHING

**What the screenshots show:** Clicking the vertical icon strip on the far left produces no visible change. The left panel stays on Script.

### Step 1 — Find the icon rail component

```bash
grep -r "icon.*rail\|IconRail\|sidebar.*icons\|leftSidebar" src/ --include="*.tsx" -l
# Also try finding by what's visually there:
grep -r "Generate\|Vault\|Library\|Location\|Cast\|Makeup" src/ --include="*.tsx" | grep -i "icon\|rail\|sidebar" | head -20
```

Look through `src/components/layout/` or `src/app/(editor)/` for the component rendering the icon strip.

### Step 2 — Check if onClick handlers exist

Open the icon rail component. Look at each icon button. They might look like one of these:

```tsx
// CASE A: No onClick at all — the handler is completely missing
<button className="rail-icon">
  <GenerateIcon />
</button>

// CASE B: onClick exists but does nothing meaningful
<button className="rail-icon" onClick={() => console.log('clicked')}>
  <GenerateIcon />
</button>

// CASE C: onClick sets state but wrong variable name
<button className="rail-icon" onClick={() => setLeftPanel('generate')}>
  // But the panel reads from 'activeFilmTab' not 'leftPanel'
</button>
```

### Step 3 — Add or fix onClick handlers

Whatever state variable the FILM TOOLBAR uses to switch panels (you found it in Bug 2), use the SAME variable for the icon rail. The icon rail and the film toolbar should both control the same state:

```tsx
// Find the setter — it's the same one from Bug 2
// If Bug 2 uses: setActiveTab('script')
// Then icon rail uses: setActiveTab('generate')

// Wire each icon:
<button onClick={() => setActiveTab('generate')} title="Generate">
  {/* icon */}
</button>
<button onClick={() => setActiveTab('vault')} title="Character Vault">
  {/* icon */}
</button>
<button onClick={() => setActiveTab('library')} title="Asset Library">
  {/* icon */}
</button>
<button onClick={() => setActiveTab('location')} title="Locations">
  {/* icon */}
</button>
<button onClick={() => setActiveTab('cast')} title="Cast">
  {/* icon */}
</button>
<button onClick={() => setActiveTab('makeup')} title="SFX Makeup">
  {/* icon */}
</button>
<button onClick={() => setActiveTab('greenscreen')} title="Green Screen">
  {/* icon */}
</button>
<button onClick={() => setActiveTab('settings')} title="Settings">
  {/* icon */}
</button>
```

### Step 4 — Add visual active state to the icon rail

The icon that matches the current active tab should be highlighted:

```tsx
// The activeTab value comes from the same store/state as Bug 2

<button
  onClick={() => setActiveTab('generate')}
  title="Generate"
  style={{
    background: activeTab === 'generate' ? 'rgba(0,229,200,0.12)' : 'transparent',
    color: activeTab === 'generate' ? '#00e5c8' : '#4a5a78',
    border: activeTab === 'generate' ? '1px solid rgba(0,229,200,0.25)' : '1px solid transparent',
    width: '32px', height: '32px', borderRadius: '6px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}
>
  {/* icon */}
</button>
```

Apply the same pattern to every icon in the rail.

---

## THE PANEL CONTENT SWITCHER — COMPLETE REFERENCE

Once you've identified the state variable name (from Bug 2, Step 1), the left panel content component must render like this. Replace `activeTab` with whatever your actual variable is called:

```tsx
// This goes in whatever component renders the left panel area
// (might be LeftPanel.tsx, might be inline in the editor layout)

export function LeftPanelContent() {
  // GET THE STATE — use whatever hook/store the toolbar already uses
  const activeTab = /* same state as the toolbar */

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {(!activeTab || activeTab === 'script') && <ScriptPanel />}
      {activeTab === 'storyboard' && <StoryboardPanel />}
      {activeTab === 'ai_director' && <AIDirectorPanel />}
      {activeTab === 'continuity' && <ContinuityPanel />}
      {activeTab === 'cast' && <CastManagerPanel />}
      {activeTab === 'locations' && <LocationPanel />}
      {activeTab === 'generate' && <GeneratePanel />}
      {activeTab === 'vault' && <VaultPanel />}
      {activeTab === 'library' && <AssetLibraryPanel />}
      {activeTab === 'makeup' && <SFXMakeupPanel />}
      {activeTab === 'greenscreen' && <GreenScreenPanel />}
      {activeTab === 'settings' && <SettingsPanel />}
    </div>
  )
}
```

If `ScriptPanel` is currently hardcoded (not inside a conditional), wrap it:
```tsx
// Find this:
<ScriptPanel />

// Change to:
{(!activeTab || activeTab === 'script') && <ScriptPanel />}
```

---

## QUICK DIAGNOSTIC COMMANDS

Run these in the Cursor terminal to find the exact files causing each bug:

```bash
# Find where film toolbar tab state is set
grep -rn "setActive\|useState\|activeTab\|filmMode\|selectedPanel" src/ --include="*.tsx" | grep -v "node_modules" | head -40

# Find where left panel content is conditionally rendered
grep -rn "ScriptPanel\|&&.*Panel\|activeTab.*Panel" src/ --include="*.tsx" | head -20

# Find the icon rail component
grep -rn "rail\|IconButton\|sidebar-icon" src/ --include="*.tsx" -l

# Check auth config
cat src/lib/auth.ts 2>/dev/null || cat src/app/api/auth/**/*.ts 2>/dev/null | head -50

# Check env vars
cat .env.local | grep -i "nextauth\|auth"
```

---

## AFTER FIXING — QUICK SMOKE TEST

Open the browser console (F12). Click each of these and verify the result:

1. Click **Script** in top toolbar → left panel shows script content ✓ (already works)
2. Click **AI Director** in top toolbar → left panel changes to AI Director panel ✗ → should now work
3. Click **Cast** in top toolbar → left panel changes to Cast panel with "Add character" button ✗ → should now work
4. Click **Generate** icon in left icon rail → left panel changes to Generate panel ✗ → should now work
5. Click **Vault** icon in left icon rail → left panel changes to Vault/Cast panel ✗ → should now work
6. Reload the page → no red error overlay, no auth error ✗ → should now work after Bug 1 fix

If any step still fails after the fix, open the browser console, click the failing button, and look for any JavaScript error. Paste the error to Cursor for targeted debugging.
