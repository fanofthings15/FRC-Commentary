import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import fs from "fs";
import os from "os";
import { unzipSync } from "fflate";
import vmixRouter from "./routes/vmix.js";
import tbaRouter from "./routes/tba.js";
import settingsRouter from "./routes/settings.js";
import { attachAlertsWebSocket } from "./ws/alerts.js";

// Static top-level import so Bun's compiler can statically detect and embed
// this file into the .exe when running `bun build --compile`. This always
// evaluates on module load (even in plain dev mode) — that's why an empty
// placeholder ui-dist.zip is committed, so the import never fails to resolve
// before you've run `bun run build:ui` for real.
import zipFile from "../ui-dist.zip" with { type: "file" };

// Pinned deliberately — this is the one port both dev (via the Vite proxy)
// and prod (single process) always use. Do not make this random/ephemeral.
const PORT = 3010;

function isCompiledExe(): boolean {
  return process.execPath.endsWith(".exe") && !process.execPath.endsWith("bun.exe");
}

// Where the built frontend's static files live, for whichever mode we're
// running in. Returns null if there's nothing to serve yet (e.g. dev mode
// before `vite build`, or a still-empty placeholder zip) — in that case the
// backend just serves the API/WebSocket and you're expected to be running
// the Vite dev server separately for the UI.
function resolveUiDir(): string | null {
  if (isCompiledExe()) {
    try {
      const zipBytes = fs.readFileSync(zipFile);
      const files = unzipSync(new Uint8Array(zipBytes));
      if (Object.keys(files).length === 0) return null; // empty placeholder, nothing real embedded

      const tempDir = path.join(os.tmpdir(), "frc-commentary-ui");
      fs.rmSync(tempDir, { recursive: true, force: true });
      fs.mkdirSync(tempDir, { recursive: true });
      for (const [name, data] of Object.entries(files)) {
        if (name.endsWith("/")) continue;
        const outPath = path.join(tempDir, name);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, data);
      }
      return tempDir;
    } catch (err) {
      console.error("Failed to unpack embedded UI:", err);
      return null;
    }
  }

  // Running from source: after `bun run build:ui`, the built frontend lives
  // at frontend/dist, two levels up from this compiled backend/src file.
  const sourceDist = path.resolve(__dirname, "../../frontend/dist");
  return fs.existsSync(sourceDist) ? sourceDist : null;
}

const app = express();
app.use(cors());
app.use(express.json());

const uiDir = resolveUiDir();
if (uiDir) {
  app.use(express.static(uiDir));
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/vmix", vmixRouter);
app.use("/api/tba", tbaRouter);
app.use("/api/settings", settingsRouter);

const server = http.createServer(app);
attachAlertsWebSocket(server);

server.listen(PORT, () => {
  console.log(`FRC Commentary server listening on http://localhost:${PORT}`);
  console.log(`Alerts WebSocket at ws://localhost:${PORT}/ws/alerts`);
  if (uiDir) {
    console.log(`Serving built frontend from ${uiDir}`);
  } else {
    console.log("No built frontend found yet — run the Vite dev server separately (bun run dev), or `bun run build:ui` first for a production-style run.");
  }
});
