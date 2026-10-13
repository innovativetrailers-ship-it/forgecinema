#!/usr/bin/env node
// Apply infra/r2-cors.json to the media bucket and read the policy back.
import { readFileSync } from 'node:fs'
import { GetBucketCorsCommand, PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3'
import { config } from 'dotenv'

config({ path: new URL('../.env.local', import.meta.url), quiet: true })
config({ path: new URL('../.env', import.meta.url), quiet: true })

const account = process.env.R2_ACCOUNT_ID?.trim()
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
const bucket = process.env.R2_BUCKET_NAME?.trim()
if (!account || !accessKeyId || !secretAccessKey || !bucket) {
  console.error('R2 account, key, and bucket name must be set')
  process.exit(1)
}

const policy = JSON.parse(readFileSync(new URL('../infra/r2-cors.json', import.meta.url), 'utf8'))
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${account}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
})

await client.send(new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: policy }))
const read = await client.send(new GetBucketCorsCommand({ Bucket: bucket }))
const rules = read.CORSRules ?? []
const origins = rules.flatMap((rule) => rule.AllowedOrigins ?? [])
console.log(`r2-cors: ${rules.length} rule(s), origins ${origins.join(', ')}`)
