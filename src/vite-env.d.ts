/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRANSLATION_API_BASE_URL?: string;
  readonly VITE_TRANSLATION_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
