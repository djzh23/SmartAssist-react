/**
 * Copies the icon pack from public/icons-logos-favicon into public/
 * so /favicon.ico and PWA icons replace the previous mark.
 */
import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'public', 'icons-logos-favicon')
const destDir = join(root, 'public')

const PACK_FILES = [
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'maskable-icon-512x512.png',
]

export function installBrandIcons() {
  if (!existsSync(srcDir)) {
    throw new Error(`Icon pack missing: ${srcDir}`)
  }

  for (const name of PACK_FILES) {
    const from = join(srcDir, name)
    if (!existsSync(from)) {
      throw new Error(`Icon pack file missing: ${name}`)
    }
    copyFileSync(from, join(destDir, name))
  }

  const chrome512 = join(srcDir, 'android-chrome-512x512.png')
  copyFileSync(chrome512, join(destDir, 'logo.png'))
  copyFileSync(chrome512, join(destDir, 'favicon.png'))
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isDirectRun) {
  installBrandIcons()
  console.log('Installed brand icons into public/')
}
