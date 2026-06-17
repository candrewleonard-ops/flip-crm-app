import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import path from "node:path";

// Single-config Vite + Electron setup.
//  - `npm run dev`   → starts the Vite dev server AND launches Electron
//                      (the plugin compiles electron/main.ts + preload.ts and
//                       points the window at the dev server with HMR).
//  - `npm run build` → builds the renderer (dist-web/) and the electron
//                      bundles (dist-electron/), ready for electron-builder.
export default defineConfig({
  base: "./",
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: "electron/main.ts",
        vite: {
          build: {
            outDir: "dist-electron",
            minify: false,
          },
        },
      },
      preload: {
        input: path.join(__dirname, "electron/preload.ts"),
        vite: {
          build: {
            outDir: "dist-electron",
            minify: false,
          },
        },
      },
    }),
  ],
  build: {
    outDir: "dist-web",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1800,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  clearScreen: false,
});
