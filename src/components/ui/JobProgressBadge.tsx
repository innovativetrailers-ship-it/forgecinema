'use client'

import { useJobsStore } from '@/store/jobs'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function JobProgressBadge() {
  const jobs = useJobsStore((s) => s.jobs)
  const activeJobs = Object.values(jobs).filter(
    (j) => j.status === 'queued' || j.status === 'processing'
  )
  const recentComplete = Object.values(jobs).filter((j) => j.status === 'complete')
  const recentFailed = Object.values(jobs).filter((j) => j.status === 'failed')

  if (activeJobs.length === 0 && recentComplete.length === 0 && recentFailed.length === 0) {
    return null
  }

  if (activeJobs.length > 0) {
    const job = activeJobs[0]
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Loader2 className="w-3 h-3 text-blue-400 animate-spin shrink-0" />
        <div className="space-y-0.5 min-w-0">
          <p className="text-[10px] text-blue-400 font-medium truncate">
            {activeJobs.length > 1
              ? `${activeJobs.length} jobs running`
              : 'Generating…'}
          </p>
          <Progress
            value={job.progress}
            className="h-0.5 w-20 bg-blue-500/20 [&>div]:bg-blue-400"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      {recentComplete.length > 0 && (
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-lg',
            'bg-emerald-500/10 border border-emerald-500/20'
          )}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-medium">
            {recentComplete.length} done
          </span>
        </div>
      )}
      {recentFailed.length > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-destructive/10 border border-destructive/20">
          <XCircle className="w-3 h-3 text-destructive" />
          <span className="text-[10px] text-destructive font-medium">
            {recentFailed.length} failed
          </span>
        </div>
      )}
    </div>
  )
}
