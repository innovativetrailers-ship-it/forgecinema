/**
 * Rebuild every served brand file from docs/brand/logo-master.png.
 * The master is the keyed 1024 edit: charcoal inside the gear, transparent outside.
 * Run: npx tsx scripts/build-brand-assets.ts
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const desktopRoot =
  process.env.FORGE_DESKTOP ?? path.resolve(root, '../cinema/cinematic-forge-v3')
const masterPath = path.join(root, 'docs/brand/logo-master.png')
const PLATE = { r: 0x0d, g: 0x11, b: 0x17, alpha: 1 }

const transparent = { r: 0, g: 0, b: 0, alpha: 0 }

const centeredBadge = async (side: number, paddingRatio: number): Promise<Buffer> => {
  const { data, info } = await sharp(masterPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > 16) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  const cropped = await sharp(masterPath)
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .png()
    .toBuffer()
  const inner = Math.round(side * (1 - paddingRatio * 2))
  const badge = await sharp(cropped)
    .resize(inner, inner, { fit: 'contain', background: transparent })
    .png()
    .toBuffer()
  return sharp({
    create: { width: side, height: side, channels: 4, background: transparent },
  })
    .composite([{ input: badge, gravity: 'centre' }])
    .png()
    .toBuffer()
}

const plated = async (side: number): Promise<Buffer> => {
  const badge = await centeredBadge(side, 0.08)
  return sharp({
    create: { width: side, height: side, channels: 4, background: PLATE },
  })
    .composite([{ input: badge, gravity: 'centre' }])
    .png()
    .toBuffer()
}

const pngIco = (png: Buffer, size: number): Buffer => {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  const entry = Buffer.alloc(16)
  entry[0] = size >= 256 ? 0 : size
  entry[1] = size >= 256 ? 0 : size
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(22, 12)
  return Buffer.concat([header, entry, png])
}

const writePng = async (file: Buffer, dest: string) => {
  mkdirSync(path.dirname(dest), { recursive: true })
  writeFileSync(dest, file)
}

const main = async () => {
  const master = await centeredBadge(1024, 0.04)
  await writePng(master, path.join(root, 'public/brand/logo.png'))
  await writePng(await centeredBadge(32, 0.04), path.join(root, 'public/brand/icon-32.png'))
  await writePng(await centeredBadge(180, 0.04), path.join(root, 'public/brand/icon-180.png'))
  await writePng(await plated(192), path.join(root, 'public/icon-192.png'))
  await writePng(await plated(512), path.join(root, 'public/icon-512.png'))

  const faviconPng = await centeredBadge(32, 0.04)
  writeFileSync(path.join(root, 'src/app/favicon.ico'), pngIco(faviconPng, 32))

  const rendererLogo = path.join(desktopRoot, 'src/renderer/assets/logo.png')
  const buildDir = path.join(desktopRoot, 'build')
  mkdirSync(path.dirname(rendererLogo), { recursive: true })
  mkdirSync(buildDir, { recursive: true })
  writeFileSync(rendererLogo, master)
  writeFileSync(path.join(buildDir, 'icon.png'), master)
  copyFileSync(path.join(buildDir, 'icon.png'), path.join(buildDir, 'icon-source.png'))
  writeFileSync(path.join(buildDir, 'icon.ico'), pngIco(await centeredBadge(256, 0.04), 256))

  if (process.platform === 'darwin') {
    const iconset = path.join(buildDir, 'icon.iconset')
    mkdirSync(iconset, { recursive: true })
    const iconPng = path.join(buildDir, 'icon.png')
    for (const size of [16, 32, 128, 256, 512]) {
      execFileSync('sips', ['-z', String(size), String(size), iconPng, '--out', path.join(iconset, `icon_${size}x${size}.png`)])
      execFileSync('sips', [
        '-z',
        String(size * 2),
        String(size * 2),
        iconPng,
        '--out',
        path.join(iconset, `icon_${size}x${size}@2x.png`),
      ])
    }
    execFileSync('iconutil', ['-c', 'icns', iconset, '-o', path.join(buildDir, 'icon.icns')])
  }

  console.log('brand assets written from', masterPath)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
