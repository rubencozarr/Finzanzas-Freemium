/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "local" (por defecto, sin backend real) o "supabase". */
  readonly VITE_DATA_BACKEND?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
