/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly APP_URL?: string;
  /** 'pruebas' muestra la franja de entorno de pruebas */
  readonly VITE_ENTORNO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
