/**
 * Dark gradient plate + centered artwork, clipped to a rounded square (professional tab icon).
 * Source: public/favicon-source.png (seeded from favicon.png on first run).
 * Run: node scripts/build-favicon.mjs
 */
import sharp from 'sharp'
import { copyFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicDir = join(root, 'public')
const sourcePath = join(publicDir, 'favicon-source.png')
const destPath = join(publicDir, 'favicon.png')

const SIZE = 512
const INSET = 40
const RADIUS = 104
const PAD = { r: 26, g: 20, b: 12, alpha: 1 }

async function main() {
  const fallback = join(publicDir, 'favicon.png')
  if (!existsSync(sourcePath)) {
    if (!existsSync(fallback)) {
      console.error('Need public/favicon.png or public/favicon-source.png')
      process.exit(1)
    }
    copyFileSync(fallback, sourcePath)
    console.log('Created public/favicon-source.png from current favicon (edit & re-run to regenerate)')
  }

  const inner = SIZE - INSET * 2

  const artwork = await sharp(sourcePath)
    .resize(inner, inner, { fit: 'contain', background: PAD })
    .png()
    .toBuffer()

  const artB64 = artwork.toString('base64')

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a1208"/>
      <stop offset="1" stop-color="#0d0800"/>
    </linearGradient>
    <clipPath id="round">
      <rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}" ry="${RADIUS}"/>
    </clipPath>
  </defs>
  <g clip-path="url(#round)">
    <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
    <image
      href="data:image/png;base64,${artB64}"
      x="${INSET}"
      y="${INSET}"
      width="${inner}"
      height="${inner}"
      preserveAspectRatio="xMidYMid meet"
    />
  </g>
</svg>`

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(destPath)

  console.log('Wrote', destPath)

  const navPath = join(publicDir, 'logo-nav.webp')
  await sharp(destPath)
    .resize(96, 96)
    .webp({ quality: 82, effort: 6 })
    .toFile(navPath)

  console.log('Wrote', navPath, '(header / in-app logo, avoids loading 512×512 PNG in nav)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
