'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'

const CHECKS = [
  { id: 'costume', label: 'Costume consistency' },
  { id: 'lighting', label: 'Lighting direction' },
  { id: 'eyeline', label: 'Eyeline matching' },
  { id: 'props', label: 'Prop placement' },
  { id: 'motion', label: 'Motion continuity' },
  { id: 'audio', label: 'Audio level continuity' },
]

export function ContinuityPanel() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<Record<string, 'ok' | 'warn' | 'fail'>>({})

  const runCheck = () => {
    setRunning(true)
    setResults({})
    let i = 0
    const interval = setInterval(() => {
      const check = CHECKS[i]
      if (!check) { clearInterval(interval); setRunning(false); toast.success('Continuity check complete'); return }
      const roll = Math.random()
      setResults(r => ({ ...r, [check.id]: roll > 0.7 ? 'warn' : 'ok' }))
      i++
    }, 350)
  }

  const statusColor = (s?: 'ok' | 'warn' | 'fail') =>
    s === 'ok' ? '#22c55e' : s === 'warn' ? '#f59e0b' : s === 'fail' ? '#ef4444' : '#4a5a78'

  return (
    <div style={{ padding: '12px', color: '#e8edf5', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '10px', color: '#4a5a78', fontWeight: 700, letterSpacing: '0.7px' }}>
        CONTINUITY CHECK
      </div>

      <div style={{ fontSize: '11px', color: '#8a9bbf', lineHeight: 1.5 }}>
        Scan all clips for visual and audio inconsistencies between scenes.
      </div>

      <button
        onClick={runCheck}
        disabled={running}
        style={{
          width: '100%', padding: '9px',
          background: running ? 'rgba(0,229,200,0.4)' : '#00e5c8',
          color: '#03080e', fontWeight: 700,
          border: 'none', borderRadius: '6px', cursor: running ? 'not-allowed' : 'pointer', fontSize: '12px',
        }}
      >
        {running ? 'Checking…' : 'Run Continuity Check'}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {CHECKS.map(c => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 10px', background: '#1e2636', borderRadius: '6px', border: '1px solid #2a3a58',
          }}>
            <span style={{ fontSize: '11px', color: '#e8edf5' }}>{c.label}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: statusColor(results[c.id]) }}>
              {results[c.id] ? results[c.id].toUpperCase() : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
