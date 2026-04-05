/// <reference types="vite/client" />

interface Window {
  /** When set before the app bundle loads, overrides the default API origin in `src/lib/api.ts`. Use "" for same-origin relative URLs. */
  __API_BASE_URL__?: string;
}
