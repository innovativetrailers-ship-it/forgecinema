import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paypalPost, CREDIT_PACKS } from '@/lib/paypal/client'

interface PayPalOrderResponse {
  id: string
  status: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = req.headers.get('x-user-id') ?? session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { packId } = await req.json() as { packId: string }
  const pack = CREDIT_PACKS.find((p) => p.packId === packId)
  if (!pack) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 })

  const order = await paypalPost<PayPalOrderResponse>('/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: { currency_code: 'USD', value: pack.priceUSD.toFixed(2) },
        description: `${pack.credits} Cinematic Forge Credits`,
        custom_id: `${userId}:${pack.packId}`,
      },
    ],
    application_context: {
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/credits/purchase/paypal/capture`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/simple`,
    },
  })

  const approvalUrl = `https://www.${process.env.PAYPAL_MODE === 'live' ? '' : 'sandbox.'}paypal.com/checkoutnow?token=${order.id}`

  return NextResponse.json({ orderId: order.id, approvalUrl })
}
