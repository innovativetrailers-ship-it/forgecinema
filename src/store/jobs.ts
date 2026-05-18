import { create } from 'zustand'

export interface ActiveJob {
  id: string
  type: string
  status: 'queued' | 'processing' | 'complete' | 'failed' | 'cancelled'
  progress: number
  message?: string
  outputUrl?: string
  outputUrls?: string[]
  error?: string
  createdAt: Date
}

interface JobsState {
  jobs: Record<string, ActiveJob>
  addJob: (job: ActiveJob) => void
  updateJob: (id: string, updates: Partial<ActiveJob>) => void
  removeJob: (id: string) => void
  clearCompleted: () => void
}

export const useJobsStore = create<JobsState>((set) => ({
  jobs: {},

  addJob: (job) =>
    set((state) => ({
      jobs: { ...state.jobs, [job.id]: job },
    })),

  updateJob: (id, updates) =>
    set((state) => ({
      jobs: {
        ...state.jobs,
        [id]: state.jobs[id] ? { ...state.jobs[id], ...updates } : state.jobs[id],
      },
    })),

  removeJob: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.jobs
      return { jobs: rest }
    }),

  clearCompleted: () =>
    set((state) => ({
      jobs: Object.fromEntries(
        Object.entries(state.jobs).filter(
          ([, job]) => job.status !== 'complete' && job.status !== 'failed'
        )
      ),
    })),
}))
