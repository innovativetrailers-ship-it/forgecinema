import { NextRequest, NextResponse } from 'next/server'
import { paypalPost } from '@/lib/paypal/client'
import { addCredits } from '@/lib/credits'
import { CREDIT_PACKS } from '@/lib/paypal/client'

interface CaptureResult {
  id: string
  status: string
  purchase_units: Array<{
    payments: {
      captures: Array<{
        id: string
        custom_id: string
      }>
    }
  }>
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/simple?error=missing_token`)

  const result = await paypalPost<CaptureResult>(`/v2/checkout/orders/${token}/capture`, {})

  if (result.status !== 'COMPLETED') {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/simple?error=payment_failed`)
  }

  const customId = result.purchase_units[0]?.payments?.captures?.[0]?.custom_id ?? ''
  const [userId, packId] = customId.split(':')
  const pack = CREDIT_PACKS.find((p) => p.packId === packId)

  if (userId && pack) {
    const captureId = result.purchase_units[0].payments.captures[0].id
    await addCredits(userId, pack.credits, `paypal:${captureId}`)
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/simple?success=credits_added`)
}
