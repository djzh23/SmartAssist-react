/// <reference types="vitest/config" />
import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const BRAND_ICON_FILES = [
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'maskable-icon-512x512.png',
] as const

function installBrandIconsPlugin(): Plugin {
  const sync = () => {
    const srcDir = join(process.cwd(), 'public', 'icons-logos-favicon')
    const destDir = join(process.cwd(), 'public')
    for (const name of BRAND_ICON_FILES) {
      const from = join(srcDir, name)
      if (!existsSync(from)) continue
      copyFileSync(from, join(destDir, name))
    }
    const chrome512 = join(srcDir, 'android-chrome-512x512.png')
    if (existsSync(chrome512)) {
      copyFileSync(chrome512, join(destDir, 'logo.png'))
      copyFileSync(chrome512, join(destDir, 'favicon.png'))
    }
  }

  return {
    name: 'install-brand-icons',
    buildStart() {
      sync()
    },
    configureServer() {
      sync()
    },
  }
}

const LOCAL_API_DEFAULT = 'http://localhost:5108'

function resolveDevApiProxyTarget(mode: string, env: Record<string, string>): string {
  const wantsRemote = env.VITE_USE_REMOTE_API === '1' || env.VITE_USE_REMOTE_API === 'true'
  const proxy = env.VITE_PROXY_TARGET?.trim()
  const apiBase = env.VITE_API_BASE_URL?.trim()

  if (mode === 'development' && proxy && /onrender\.com|vercel\.app/i.test(proxy) && !wantsRemote) {
    // .env.example used to default to production; unreleased routes (e.g. /api/profile) then return 404.
    console.warn(
      `[vite] Ignoring VITE_PROXY_TARGET=${proxy} for /api proxy — use ${LOCAL_API_DEFAULT} (PrivatePrep launchSettings), or set VITE_USE_REMOTE_API=1 to force this target.`,
    )
    return LOCAL_API_DEFAULT
  }

  if (proxy) return proxy
  if (apiBase) {
    try {
      return new URL(apiBase).origin
    } catch {
      /* ignore */
    }
  }
  return LOCAL_API_DEFAULT
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = resolveDevApiProxyTarget(mode, env)

  return {
    plugins: [react(), installBrandIconsPlugin()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        reporter: ['text', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/vite-env.d.ts'],
      },
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
