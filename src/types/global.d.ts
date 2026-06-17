import type { FlipApi } from "../lib/types";

declare global {
  interface Window {
    /**
     * Typed IPC bridge exposed by electron/preload.ts. Present whenever the
     * renderer runs inside Electron. In a plain browser (e.g. `vite preview`)
     * this is undefined and the store falls back to localStorage.
     */
    api?: FlipApi;
  }
}

export {};
