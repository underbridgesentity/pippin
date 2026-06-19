/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_AUTH_PROVIDERS?: string
  readonly VITE_MEAL_ANALYZER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
