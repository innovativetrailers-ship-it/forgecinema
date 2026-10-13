#!/usr/bin/env node
// Signed GET with an Origin header. Reports whether the bucket returns Access-Control-Allow-Origin.
// Does not delete objects. Does not print credentials or the signed URL.
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { config } from 'dotenv'

config({ path: new URL('../.env.local', import.meta.url), quiet: true })
config({ path: new URL('../.env', import.meta.url), quiet: true })

const account = process.env.R2_ACCOUNT_ID?.trim()
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
const bucket = process.env.R2_BUCKET_NAME?.trim()
const key = process.env.R2_OBJECT_KEY?.trim()
const origin = 'https://forgecinema.vercel.app'

if (!account || !accessKeyId || !secretAccessKey || !bucket) {
  console.error('R2 account, key, and bucket name must be set')
  process.exit(1)
}
if (!key) {
  console.error('Set R2_OBJECT_KEY to an existing media object. Nothing was deleted.')
  process.exit(1)
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${account}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
})
const signed = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 60 })
const res = await fetch(signed, { method: 'GET', headers: { Origin: origin, Range: 'bytes=0-0' } })
const allow = res.headers.get('access-control-allow-origin')
console.log(`r2-cors verify: status ${res.status}, access-control-allow-origin ${allow ?? 'absent'}`)
if (allow !== origin && allow !== '*') process.exit(1)
