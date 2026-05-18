'use client'
import { useQuery } from '@tanstack/react-query'

interface Avatar {
  id: string
  name: string
  photoUrl: string
  status: string
}

interface AvatarGalleryProps {
  onSelect: (avatarId: string) => void
}

export function AvatarGallery({ onSelect }: AvatarGalleryProps) {
  const { data, isLoading } = useQuery<{ avatars: Avatar[] }>({
    queryKey: ['avatars'],
    queryFn: () => fetch('/api/avatar/list').then((r) => r.json()),
  })

  const avatars = data?.avatars ?? []

  if (isLoading) {
    return (
      <div className="p-4 text-gray-500 text-sm text-center">Loading avatars…</div>
    )
  }

  if (avatars.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm text-center">
        No avatars yet. Create one above.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {avatars.map((av) => (
        <button
          key={av.id}
          onClick={() => onSelect(av.id)}
          className="p-3 bg-[#1a1f2e] rounded-xl text-left hover:bg-[#1a1f2e]/80 border border-transparent hover:border-[#00e5c8]/30 transition"
        >
          <img
            src={av.photoUrl}
            alt={av.name}
            className="w-12 h-12 rounded-full object-cover mb-2"
          />
          <div className="text-white text-xs font-medium truncate">{av.name}</div>
          <div className="text-gray-500 text-xs">{av.status}</div>
        </button>
      ))}
    </div>
  )
}
