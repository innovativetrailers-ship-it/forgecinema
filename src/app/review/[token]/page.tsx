'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

interface ReviewComment {
  id: string
  authorName: string
  timecode: number
  text: string
  resolved: boolean
  createdAt: string
}

interface ReviewData {
  title: string
  status: string
  allowDownload: boolean
  projectId: string
  comments: ReviewComment[]
}

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>()
  const [review, setReview] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [annotation, setAnnotation] = useState<{ x: number; y: number } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetch(`/api/review/public/${token}`)
      .then((r) => r.json())
      .then((data) => {
        setReview(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Review not found or expired')
        setLoading(false)
      })
  }, [token])

  function handleFrameClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setAnnotation({ x, y })
    if (videoRef.current) videoRef.current.pause()
  }

  async function submitComment() {
    if (!commentText.trim() || !authorName.trim() || !authorEmail.trim()) return
    setSubmitting(true)
    try {
      await fetch('/api/review/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          authorName,
          authorEmail,
          timecode: currentTime,
          text: commentText,
          annotationData: annotation,
        }),
      })
      setCommentText('')
      setAnnotation(null)
      // Reload comments
      const data = await fetch(`/api/review/public/${token}`).then((r) => r.json())
      setReview(data)
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(status: 'approved' | 'changes_requested') {
    await fetch(`/api/review/status/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setReview((prev) => prev ? { ...prev, status } : prev)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c10] flex items-center justify-center">
        <div className="text-white text-lg">Loading review...</div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-[#0c0c10] flex items-center justify-center">
        <div className="text-red-400 text-lg">{error ?? 'Review not found'}</div>
      </div>
    )
  }

  const statusColor = {
    pending: 'text-[#00e5c8]',
    approved: 'text-green-400',
    changes_requested: 'text-red-400',
  }[review.status] ?? 'text-gray-400'

  return (
    <div className="min-h-screen bg-[#0c0c10] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{review.title}</h1>
          <span className={`text-sm ${statusColor} capitalize`}>{review.status.replace('_', ' ')}</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => updateStatus('approved')}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => updateStatus('changes_requested')}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors"
          >
            Request Changes
          </button>
        </div>
      </div>

      <div className="flex gap-6 p-6">
        {/* Video player */}
        <div className="flex-1">
          <div className="relative bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              className="w-full"
              controls
              onTimeUpdate={() => {
                if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
              }}
            >
              <source src={`/api/review/stream/${token}`} />
            </video>
            {/* Annotation canvas overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onClick={handleFrameClick}
            />
            {annotation && (
              <div
                className="absolute w-6 h-6 rounded-full bg-[#00f0d5] border-2 border-white -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${annotation.x}%`, top: `${annotation.y}%` }}
              />
            )}
          </div>

          {/* Comment form */}
          <div className="mt-4 bg-white/5 rounded-xl p-4 space-y-3">
            <div className="text-sm text-gray-400">
              Comment at {formatTime(currentTime)} {annotation ? `· Pin at (${annotation.x.toFixed(0)}%, ${annotation.y.toFixed(0)}%)` : ''}
            </div>
            <div className="flex gap-3">
              <input
                className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-teal-400"
                placeholder="Your name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
              <input
                className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-teal-400"
                placeholder="Your email"
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
              />
            </div>
            <textarea
              className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-teal-400 resize-none"
              rows={3}
              placeholder="Leave a comment... (click on the video frame to pin an annotation)"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                onClick={submitComment}
                disabled={submitting || !commentText.trim()}
                className="px-4 py-2 bg-[#00e5c8] hover:bg-[#00f0d5] disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? 'Posting...' : 'Post comment'}
              </button>
            </div>
          </div>
        </div>

        {/* Comments panel */}
        <div className="w-80 flex-shrink-0 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Comments ({review.comments.length})
          </h2>
          {review.comments.length === 0 ? (
            <div className="text-gray-500 text-sm">No comments yet.</div>
          ) : (
            review.comments.map((c) => (
              <div
                key={c.id}
                className="bg-white/5 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = c.timecode
                    videoRef.current.play()
                  }
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{c.authorName}</span>
                  <span className="text-xs text-[#00e5c8]">{formatTime(c.timecode)}</span>
                </div>
                <p className="text-sm text-gray-300">{c.text}</p>
                {c.resolved && (
                  <span className="text-xs text-green-400 mt-1 block">✓ Resolved</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
