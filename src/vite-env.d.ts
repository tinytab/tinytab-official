interface ImportMetaEnv {
  readonly VITE_API_PRIMARY: string;
  readonly VITE_API_BACKUP: string;
  readonly VITE_TURNSTILE_SITE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
