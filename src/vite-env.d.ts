/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /**
   * Optional override for the Supabase Storage bucket used by
   * `src/lib/upload-media.ts`. Defaults to `user-uploads` when unset.
   */
  readonly VITE_SUPABASE_UPLOADS_BUCKET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
