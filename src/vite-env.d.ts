/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_URL: string
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_PROXY_TARGET: string
  readonly VITE_USE_REMOTE_API: string
  readonly VITE_REMAINING_FREE_SLOTS: string
  readonly VITE_PIRSCH_CODE: string
  readonly VITE_ANALYTICS_DOMAIN: string
  readonly VITE_NEWSLETTER_EMBED_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.md?raw' {
  const content: string
  export default content
}
