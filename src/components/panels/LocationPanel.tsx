'use client'

import { useState } from 'react'

const PRESETS = [
  'Downtown Alley', 'Rooftop Sunset', 'Forest Path', 'Abandoned Warehouse',
  'Beach at Dusk', 'Corporate Office', 'Underground Bunker', 'Mountain Peak',
  'Space Station', 'Medieval Castle', 'Neon-lit Bar', 'Hospital Corridor',
]

export function LocationPanel() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = query ? PRESETS.filter(p => p.toLowerCase().includes(query.toLowerCase())) : PRESETS

  return (
    <div style={{ padding: '12px', color: '#e8edf5', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontSize: '10px', color: '#4a5a78', fontWeight: 700, letterSpacing: '0.7px' }}>
        LOCATIONS
      </div>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search locations…"
        style={{
          width: '100%', background: '#1e2636', border: '1px solid #2a3a58',
          borderRadius: '6px', padding: '7px 10px', color: '#e8edf5', fontSize: '12px',
          outline: 'none', boxSizing: 'border-box',
        }}
      />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filtered.map(loc => (
          <button
            key={loc}
            onClick={() => setSelected(loc)}
            style={{
              textAlign: 'left', padding: '8px 10px',
              background: selected === loc ? 'rgba(0,229,200,0.1)' : '#1e2636',
              border: `1px solid ${selected === loc ? 'rgba(0,229,200,0.35)' : '#2a3a58'}`,
              borderRadius: '6px', color: selected === loc ? '#00e5c8' : '#e8edf5',
              fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {loc}
          </button>
        ))}
        {filtered.length === 0 && (
          <div style={{ color: '#4a5a78', fontSize: '11px', textAlign: 'center', paddingTop: '20px' }}>
            No locations match
          </div>
        )}
      </div>

      {selected && (
        <button
          style={{
            width: '100%', padding: '9px', background: '#00e5c8',
            color: '#03080e', fontWeight: 700, border: 'none',
            borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
          }}
        >
          Apply "{selected}" to Clip
        </button>
      )}
    </div>
  )
}
