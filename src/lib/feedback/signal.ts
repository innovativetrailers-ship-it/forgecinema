// Implicit reward signals — the client side of the RLAIF loop. User actions
// (keeping/exporting a render vs regenerating it) feed the routing policy so
// models that produce kept work rise and models that get redone fall away.
// Fire-and-forget: a failed signal must never disrupt the user's action.

export type RewardSignal =
  | 'export'
  | 'watch_complete'
  | 'thumbs_up'
  | 'regenerate'
  | 'discard'
  | 'thumbs_down'

export function fireRewardSignal(jobId: string | undefined | null, signal: RewardSignal): void {
  if (!jobId) return
  void fetch('/api/feedback/signal', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, signal }),
  }).catch(() => {})
}
