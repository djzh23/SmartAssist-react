/**
 * Tab icon, header mark, and OG image from public/privateprep-logo.png.
 * Also writes favicon.ico (Google Search crawlers often request /favicon.ico).
 * Run: node scripts/build-favicon.mjs
 */
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { existsSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicDir = join(root, 'public')
const sourcePath = join(publicDir, 'privateprep-logo.png')
const destPath = join(publicDir, 'favicon.png')

const SIZE = 512
const INSET = 8
const RADIUS = 104
const PAD = { r: 10, g: 10, b: 10, alpha: 1 }

async function knockoutEdgeBlack(inputPath, threshold) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const seen = new Uint8Array(width * height)
  const stack = []

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const idx = y * width + x
    if (seen[idx]) return
    seen[idx] = 1
    stack.push(idx)
  }

  for (let x = 0; x < width; x++) {
    enqueue(x, 0)
    enqueue(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y)
    enqueue(width - 1, y)
  }

  while (stack.length) {
    const idx = stack.pop()
    const i = idx * channels
    if (data[i] > threshold || data[i + 1] > threshold || data[i + 2] > threshold) continue
    data[i + 3] = 0
    const x = idx % width
    const y = (idx / width) | 0
    enqueue(x + 1, y)
    enqueue(x - 1, y)
    enqueue(x, y + 1)
    enqueue(x, y - 1)
  }

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer()
}

async function main() {
  if (!existsSync(sourcePath)) {
    console.error('Need public/privateprep-logo.png')
    process.exit(1)
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
      <stop offset="0" stop-color="#0a0a0a"/>
      <stop offset="1" stop-color="#0a0a0a"/>
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

  const icoPath = join(publicDir, 'favicon.ico')
  const icoBuf = await pngToIco(destPath)
  writeFileSync(icoPath, icoBuf)
  console.log('Wrote', icoPath)

  const navPath = join(publicDir, 'logo-nav.webp')
  const transparent = await knockoutEdgeBlack(sourcePath, 28)
  const trimmed = await sharp(transparent)
    .trim({ threshold: 8 })
    .toBuffer()
  await sharp(trimmed)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, effort: 6 })
    .toFile(navPath)

  console.log('Wrote', navPath, '(header / in-app logo, avoids loading the full PNG in nav)')

  const ogPath = join(publicDir, 'logo.png')
  await sharp(sourcePath)
    .resize(1200, 1200, { fit: 'contain', background: PAD })
    .png({ compressionLevel: 9 })
    .toFile(ogPath)

  console.log('Wrote', ogPath)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
