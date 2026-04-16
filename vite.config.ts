import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const LOCAL_API_DEFAULT = 'http://localhost:5194'

function resolveDevApiProxyTarget(mode: string, env: Record<string, string>): string {
  const wantsRemote = env.VITE_USE_REMOTE_API === '1' || env.VITE_USE_REMOTE_API === 'true'
  const proxy = env.VITE_PROXY_TARGET?.trim()
  const apiBase = env.VITE_API_BASE_URL?.trim()

  if (mode === 'development' && proxy && /onrender\.com|vercel\.app/i.test(proxy) && !wantsRemote) {
    // .env.example used to default to production; unreleased routes (e.g. /api/profile) then return 404.
    console.warn(
      `[vite] Ignoring VITE_PROXY_TARGET=${proxy} for /api proxy — use ${LOCAL_API_DEFAULT} for local API (SmartAssistApi), or set VITE_USE_REMOTE_API=1 to force this target.`,
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
    plugins: [react()],
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
