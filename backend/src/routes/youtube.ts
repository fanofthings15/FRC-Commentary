import { Router, Request, Response } from "express";
import { getLatestYouTubeStats, setWatchHoursOffset } from "../youtubeStats.js";

const router = Router();

// GET /api/youtube/stats
// Returns the latest cached stream stats. The actual polling + watch-hours
// accumulation runs in the backend (see youtubeStats.ts) so that any number of
// open dashboards read one shared figure instead of each driving the integral.
router.get("/stats", (_req: Request, res: Response) => {
  res.json(getLatestYouTubeStats());
});

// POST /api/youtube/watch-hours { hours: number }
// Corrects the live-accumulated watch-hours total to the given value. Hosts
// use this if it drifts out of sync with what they know is actually right
// (a backend restart, a network gap, etc.) - see setWatchHoursOffset.
router.post("/watch-hours", (req: Request, res: Response) => {
  const hours = Number(req.body?.hours);
  if (!Number.isFinite(hours) || hours < 0) {
    return res.status(400).json({ error: "'hours' must be a non-negative number." });
  }
  const result = setWatchHoursOffset(hours);
  if ("error" in result) {
    return res.status(400).json(result);
  }
  res.json(result);
});

export default router;
