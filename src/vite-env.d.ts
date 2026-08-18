/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_URL: string
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_PROXY_TARGET: string
  readonly VITE_USE_REMOTE_API: string
  readonly VITE_REMAINING_FREE_SLOTS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
