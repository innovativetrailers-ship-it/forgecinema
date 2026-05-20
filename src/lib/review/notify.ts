import { db } from '@/lib/db'

export type ReviewDecision = 'approved' | 'changes_requested'

export async function notifyProjectOwner(params: {
  reviewLinkId: string
  projectId: string
  ownerUserId: string
  title: string
  decision: ReviewDecision
  approverName: string
  approverEmail: string
  note?: string
}): Promise<void> {
  const owner = await db.user.findUnique({
    where: { id: params.ownerUserId },
    select: { email: true, name: true },
  })
  if (!owner?.email) return

  const project = await db.project.findUnique({
    where: { id: params.projectId },
    select: { title: true },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const reviewUrl = `${appUrl}/review/${params.reviewLinkId}`
  const decisionLabel =
    params.decision === 'approved' ? 'Approved' : 'Changes requested'

  const body = [
    `Hi ${owner.name ?? 'there'},`,
    '',
    `${params.approverName} (${params.approverEmail}) marked "${params.title}" as ${decisionLabel}.`,
    project?.title ? `Project: ${project.title}` : '',
    params.note ? `Note: ${params.note}` : '',
    '',
    `Open review: ${reviewUrl}`,
  ]
    .filter(Boolean)
    .join('\n')

  const apiKey = process.env.RESEND_API_KEY
  if (apiKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.REVIEW_EMAIL_FROM ?? 'reviews@cinematicforge.ai',
          to: owner.email,
          subject: `[Cinematic Forge] Review ${decisionLabel}: ${params.title}`,
          text: body,
        }),
      })
      return
    } catch (err) {
      console.warn('[review-notify] Resend failed:', (err as Error).message)
    }
  }

  console.info(`[review-notify] ${decisionLabel} for "${params.title}" → ${owner.email}`)
}
