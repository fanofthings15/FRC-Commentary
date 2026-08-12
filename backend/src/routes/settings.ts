import { Router, Request, Response } from "express";
import { loadSettings, saveSettings } from "../settingsStore.js";
import { errorMessage } from "../util.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const data = loadSettings();
  res.json({ settings: data });
});

router.post("/", (req: Request, res: Response) => {
  try {
    saveSettings(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: errorMessage(err) });
  }
});

export default router;
