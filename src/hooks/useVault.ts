'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useVaultStore } from '@/store/vault'
import { useEffect } from 'react'

export function useVault(projectId: string | null) {
  const setCharacters = useVaultStore((s) => s.setCharacters)
  const queryClient = useQueryClient()

  const { data: characters, isLoading } = useQuery({
    queryKey: ['vault', 'characters', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/vault/character/list?projectId=${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch characters')
      return res.json()
    },
    enabled: !!projectId,
  })

  useEffect(() => {
    if (characters) setCharacters(characters)
  }, [characters, setCharacters])

  const createCharacter = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/vault/character/create', {
        method: 'POST',
        body: data,
      })
      if (!res.ok) throw new Error('Failed to create character')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault', 'characters', projectId] })
    },
  })

  return {
    characters: characters ?? [],
    isLoading,
    createCharacter: createCharacter.mutate,
    isCreating: createCharacter.isPending,
  }
}
