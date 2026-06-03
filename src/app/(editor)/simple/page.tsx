'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { TextToVideoTab } from '@/components/simple/TextToVideoTab'
import { ImageToVideoTab } from '@/components/simple/ImageToVideoTab'
import { AudioToVideoTab } from '@/components/simple/AudioToVideoTab'
import { AutoSocialTab } from '@/components/simple/AutoSocialTab'
import { ResultsGallery } from '@/components/simple/ResultsGallery'
import { TopBar } from '@/components/layout/TopBar'
import { useCredits } from '@/hooks/useCredits'
import type { GeneratedClip, SimpleTab } from '@/components/simple/types'
import { fireRewardSignal } from '@/lib/feedback/signal'
import { nanoid } from 'nanoid'

const TABS: Array<{ id: SimpleTab; label: string; icon: string }> = [
  { id: 'text', label: 'Text to Video', icon: '✦' },
  { id: 'image', label: 'Image to Video', icon: '⊡' },
  { id: 'audio', label: 'Audio to Video', icon: '♪' },
  { id: 'social', label: 'Drop & Direct', icon: '⬡' },
]

export default function SimplePage() {
  const { data: session } = useSession()
  const { balance: creditBalance } = useCredits()
  const [activeTab, setActiveTab] = useState<SimpleTab>('text')
  const [clips, setClips] = useState<GeneratedClip[]>([])

  const userRole = (session?.user as { role?: string })?.role ?? 'FREE'

  const handleGenerated = useCallback((clip: GeneratedClip) => {
    setClips((prev) => {
      const exists = prev.findIndex((c) => c.id === clip.id)
      if (exists >= 0) {
        const updated = [...prev]
        updated[exists] = clip
        return updated
      }
      return [clip, ...prev]
    })
  }, [])

  const handleRegenerate = useCallback((clip: GeneratedClip) => {
    // Redoing a render is a strong negative reward for the models that made it.
    fireRewardSignal(clip.jobId, 'regenerate')
    // Re-add the clip as a new generation with same params
    const newClip: GeneratedClip = {
      ...clip,
      id: nanoid(),
      jobId: nanoid(),
      status: 'queued',
      progress: 0,
      videoUrl: undefined,
      error: undefined,
      createdAt: new Date(),
    }
    handleGenerated(newClip)
    // Trigger the actual API call
    fetch('/api/jobs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'GENERATE',
        payload: { prompt: clip.prompt, model: clip.model, duration: clip.duration, aspectRatio: clip.aspectRatio },
      }),
    })
      .then((r) => r.json())
      .then(({ jobId }: { jobId: string }) => {
        handleGenerated({ ...newClip, id: jobId, jobId, status: 'processing' })
        const sse = new EventSource(`/api/jobs/${jobId}/stream`)
        sse.onmessage = (e) => {
          const data = JSON.parse(e.data) as { status: string; progress?: number; outputUrl?: string; error?: string; message?: string }
          if (data.status === 'complete' && data.outputUrl) {
            handleGenerated({ ...newClip, id: jobId, jobId, status: 'complete', videoUrl: data.outputUrl, progress: 100 })
            sse.close()
          } else if (data.status === 'failed') {
            handleGenerated({ ...newClip, id: jobId, jobId, status: 'failed', error: data.error ?? 'Failed' })
            sse.close()
          } else {
            handleGenerated({ ...newClip, id: jobId, jobId, status: 'processing', progress: data.progress, progressMessage: data.message })
          }
        }
        sse.onerror = () => sse.close()
      })
      .catch(() => {
        handleGenerated({ ...newClip, status: 'failed', error: 'Failed to create job' })
      })
  }, [handleGenerated])

  const handleAddToTimeline = useCallback((clip: GeneratedClip) => {
    // Keeping a render (carrying it into the edit) is a strong positive reward.
    fireRewardSignal(clip.jobId, 'export')
    // Persist clip to the editor store for the Advanced timeline
    if (typeof window !== 'undefined') {
      const pending = JSON.parse(localStorage.getItem('cinema:timeline:pending') ?? '[]') as GeneratedClip[]
      localStorage.setItem('cinema:timeline:pending', JSON.stringify([...pending, clip]))
    }
  }, [])

  const handleDelete = useCallback((id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-base)] text-[var(--text-primary)] overflow-hidden">
      <TopBar />
      <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-24">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Studio</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Create AI-powered video from any source</p>
        </div>

        <div className="flex gap-8">
          {/* Left panel — creation */}
          <div className="w-[440px] flex-shrink-0">
            <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-[var(--border)]">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 py-3.5 text-xs font-medium transition-all relative
                      ${activeTab === tab.id
                        ? 'text-[var(--teal-bright)] bg-[var(--teal-glow)]'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}
                    `}
                  >
                    <span className="block text-sm mb-0.5">{tab.icon}</span>
                    <span className="hidden sm:block">{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--teal-bright)] rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-5">
                {activeTab === 'text' && (
                  <TextToVideoTab
                    onGenerated={handleGenerated}
                    creditBalance={creditBalance ?? 0}
                    userRole={userRole}
                  />
                )}
                {activeTab === 'image' && (
                  <ImageToVideoTab
                    onGenerated={handleGenerated}
                    creditBalance={creditBalance ?? 0}
                  />
                )}
                {activeTab === 'audio' && (
                  <AudioToVideoTab
                    onGenerated={handleGenerated}
                    creditBalance={creditBalance ?? 0}
                  />
                )}
                {activeTab === 'social' && (
                  <AutoSocialTab onRecipeReady={(r) => console.log('Recipe ready:', r.recipe.id)} />
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Generated', value: clips.length },
                { label: 'Complete', value: clips.filter((c) => c.status === 'complete').length },
                { label: 'Credits', value: creditBalance ?? '…' },
              ].map((stat) => (
                <div key={stat.label} className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] p-3 text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)]">{stat.value}</div>
                  <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel — results */}
          <div className="flex-1 min-w-0">
            <ResultsGallery
              clips={clips}
              onRegenerate={handleRegenerate}
              onAddToTimeline={handleAddToTimeline}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
