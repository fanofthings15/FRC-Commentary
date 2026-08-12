import { Router, Request, Response } from "express";
import { settingsSchema } from "frc-commentary-shared";
import { loadSettings, saveSettings } from "../settingsStore.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  // Validate what's on disk against the schema so a stale or corrupt file
  // never reaches the frontend as a half-valid object; fall back to null.
  const parsed = settingsSchema.safeParse(loadSettings());
  res.json({ settings: parsed.success ? parsed.data : null });
});

router.post("/", (req: Request, res: Response) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid settings", issues: parsed.error.issues });
  }
  try {
    saveSettings(parsed.data);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
