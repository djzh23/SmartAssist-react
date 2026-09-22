/**
 * Installs the checked-in icon pack into public/ (replaces the previous
 * privateprep-logo.png raster pipeline).
 * Run: node scripts/build-favicon.mjs
 */
import { installBrandIcons } from './install-brand-icons.mjs'

installBrandIcons()
console.log('Wrote favicon, apple-touch, chrome and OG icons from public/icons-logos-favicon')
