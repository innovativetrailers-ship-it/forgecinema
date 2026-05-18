/**
 * Frame.io v4 review integration.
 * Uploads generated clips for client/supervisor review and syncs comments
 * back into CINÉMA's built-in review portal.
 */

export interface ReviewComment {
  id: string
  text: string
  author: string
  timestamp: number   // seconds — timecode within the clip
  createdAt: string
  resolved: boolean
}

const FRAMEIO_BASE = 'https://api.frame.io/v4'

function getHeaders(): HeadersInit {
  const token = process.env.FRAMEIO_TOKEN
  if (!token) throw new Error('FRAMEIO_TOKEN env var is not set')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function createFrameIOProject(params: {
  name: string
  teamId: string
}): Promise<string> {
  const res = await fetch(`${FRAMEIO_BASE}/projects`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name: params.name, team_id: params.teamId }),
  })
  if (!res.ok) throw new Error(`Frame.io createProject failed: ${res.statusText}`)
  const data = await res.json() as { id: string }
  return data.id
}

export async function uploadToFrameIO(params: {
  videoUrl: string
  projectId: string
  name: string
  description?: string
  frameRate: number
}): Promise<{ assetId: string; reviewLink: string }> {
  // 1. Create asset placeholder
  const assetRes = await fetch(`${FRAMEIO_BASE}/assets`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      name: params.name,
      type: 'file',
      project_id: params.projectId,
      description: params.description ?? '',
      fps: params.frameRate,
    }),
  })
  if (!assetRes.ok) throw new Error(`Frame.io asset creation failed: ${assetRes.statusText}`)
  const asset = await assetRes.json() as { id: string; upload_urls?: string[]; link?: string }

  // 2. Upload the video by fetching from our URL and posting to Frame.io upload URL
  if (asset.upload_urls?.[0]) {
    const videoData = await fetch(params.videoUrl)
    if (!videoData.ok) throw new Error('Could not fetch video for Frame.io upload')
    const blob = await videoData.blob()

    await fetch(asset.upload_urls[0], {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': 'video/mp4' },
    })
  }

  // 3. Build review link
  const reviewLink = asset.link ?? `https://app.frame.io/reviews/${asset.id}`
  return { assetId: asset.id, reviewLink }
}

export async function syncFrameIOComments(params: {
  assetId: string
}): Promise<ReviewComment[]> {
  const res = await fetch(`${FRAMEIO_BASE}/assets/${params.assetId}/comments`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Frame.io comment sync failed: ${res.statusText}`)

  const data = await res.json() as Array<{
    id: string
    text: string
    owner: { name: string }
    timestamp: number
    created_at: string
    has_replies: boolean
  }>

  return data.map(c => ({
    id: c.id,
    text: c.text ?? '',
    author: c.owner?.name ?? 'Unknown',
    timestamp: c.timestamp ?? 0,
    createdAt: c.created_at,
    resolved: false,
  }))
}

export async function getFrameIOTeams(): Promise<Array<{ id: string; name: string }>> {
  const res = await fetch(`${FRAMEIO_BASE}/teams`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Frame.io getTeams failed: ${res.statusText}`)
  const data = await res.json() as Array<{ id: string; name: string }>
  return data
}

export async function getFrameIOProjects(teamId: string): Promise<Array<{ id: string; name: string }>> {
  const res = await fetch(`${FRAMEIO_BASE}/projects?team_id=${teamId}`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Frame.io getProjects failed: ${res.statusText}`)
  const data = await res.json() as Array<{ id: string; name: string }>
  return data
}
