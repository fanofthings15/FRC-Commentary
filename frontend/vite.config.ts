import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import { fileURLToPath, URL } from "url";

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8")
);

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // REST API calls
      "/api": { target: "http://127.0.0.1:3010", changeOrigin: true },
      // NOTE: no /ws proxy entry - it was confirmed (via live browser
      // testing) to fail outright for this WebSocket connection even though
      // the REST proxy above works fine. The frontend now connects directly
      // to ws://localhost:3010/ws/alerts in dev instead, bypassing this
      // proxy entirely (see src/wsUtils.ts) - WebSockets aren't subject to
      // the same-origin restrictions that make proxying necessary for
      // fetch()/XHR, so this works without needing a proxy at all.
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  define: {
    // Baked into the running app so it knows its own version (used by the
    // future auto-updater to compare against the latest GitHub release).
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
