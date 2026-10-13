import { readFileSync } from 'node:fs'

const catalog = readFileSync('src/lib/desktop/releases.ts', 'utf8')
const route = readFileSync('src/app/api/desktop/download/route.ts', 'utf8')
const page = readFileSync('src/app/download/page.tsx', 'utf8')

const macArm = catalog.match(/mac_arm:\s*\{\s*version:\s*'3\.0\.5',\s*released:\s*(true|false)/)
const macIntel = catalog.match(/mac_intel:\s*\{\s*version:\s*'3\.0\.5',\s*released:\s*(true|false)/)
if (!macArm || macArm[1] !== 'false' || !macIntel || macIntel[1] !== 'false') {
  console.error('check-download-gate: mac 3.0.5 must stay released: false')
  process.exit(1)
}
if (!route.includes("error: 'downloads_closed'") || !route.includes('status: 503')) {
  console.error('check-download-gate: download route must fail closed with 503')
  process.exit(1)
}
const gateAt = route.indexOf('isPlatformReleased')
const redirectAt = route.indexOf('NextResponse.redirect')
if (gateAt < 0 || (redirectAt >= 0 && gateAt > redirectAt)) {
  console.error('check-download-gate: the closed check must run before any redirect')
  process.exit(1)
}
if (!page.includes('Desktop download opens soon')) {
  console.error('check-download-gate: download page must say the desktop download opens soon')
  process.exit(1)
}
console.log('check-download-gate: 0')
