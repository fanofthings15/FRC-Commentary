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
      "/api": { target: "http://localhost:3010" },
      // Alerts WebSocket
      "/ws": { target: "http://localhost:3010", ws: true },
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
