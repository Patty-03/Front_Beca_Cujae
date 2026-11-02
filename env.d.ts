/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_AUTH_MODE?: 'http' | 'demo'
  readonly VITE_DEMO_ROLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
