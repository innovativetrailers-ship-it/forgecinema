const BASE =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

let _token: { access_token: string; expires_at: number } | null = null

async function getAccessToken(): Promise<string> {
  if (_token && _token.expires_at > Date.now() + 60_000) return _token.access_token

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`)
  const data = await res.json() as { access_token: string; expires_in: number }
  _token = { access_token: data.access_token, expires_at: Date.now() + data.expires_in * 1000 }
  return _token.access_token
}

export async function paypalPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PayPal ${path} failed (${res.status}): ${err}`)
  }
  return res.json() as Promise<T>
}

export async function paypalGet<T>(path: string): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PayPal GET ${path} failed (${res.status}): ${err}`)
  }
  return res.json() as Promise<T>
}

export const CREDIT_PACKS = [
  { credits: 100,    priceUSD: 5,   packId: '100' },
  { credits: 500,    priceUSD: 20,  packId: '500' },
  { credits: 2000,   priceUSD: 65,  packId: '2000' },
  { credits: 10000,  priceUSD: 250, packId: '10000' },
]

export const PAYPAL_PLAN_IDS: Record<string, Record<string, string>> = {
  pro:      { monthly: process.env.PAYPAL_PLAN_PRO_MONTHLY ?? '',      yearly: process.env.PAYPAL_PLAN_PRO_YEARLY ?? '' },
  studio:   { monthly: process.env.PAYPAL_PLAN_STUDIO_MONTHLY ?? '',   yearly: process.env.PAYPAL_PLAN_STUDIO_YEARLY ?? '' },
  ultimate: { monthly: process.env.PAYPAL_PLAN_ULTIMATE_MONTHLY ?? '', yearly: process.env.PAYPAL_PLAN_ULTIMATE_YEARLY ?? '' },
}
