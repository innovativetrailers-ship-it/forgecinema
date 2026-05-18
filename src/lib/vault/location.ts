import { db } from '../db'
import { uploadToR2 } from '../storage/r2'
import { nanoid } from 'nanoid'

export async function createLocation(params: {
  projectId: string
  name: string
  source: 'MAPILLARY' | 'CESIUM' | 'OSM_FALLBACK' | 'USER_UPLOAD'
  lat?: number
  lng?: number
  imageUrls?: string[]
  generativePrompt?: string
  hdriUrl?: string
  depthMapUrl?: string
  metaJson?: Record<string, unknown>
}) {
  return db.vaultLocation.create({
    data: {
      projectId: params.projectId,
      name: params.name,
      source: params.source,
      lat: params.lat,
      lng: params.lng,
      referenceUrls: params.imageUrls ?? [],
      generativePrompt: params.generativePrompt,
      hdriUrl: params.hdriUrl,
      depthMapUrl: params.depthMapUrl,
      metaJson: params.metaJson ? JSON.parse(JSON.stringify(params.metaJson)) : undefined,
    },
  })
}

export async function listLocations(projectId: string) {
  return db.vaultLocation.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function uploadLocationImage(
  buffer: Buffer,
  projectId: string,
  contentType: string
): Promise<string> {
  const ext = contentType.split('/')[1] ?? 'jpg'
  const key = `vault/locations/${projectId}/${nanoid()}.${ext}`
  return uploadToR2(buffer, key, contentType)
}
