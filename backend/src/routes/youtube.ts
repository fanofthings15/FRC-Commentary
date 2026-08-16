import { Router, Request, Response } from "express";
import { getLatestYouTubeStats } from "../youtubeStats.js";

const router = Router();

// GET /api/youtube/stats
// Returns the latest cached stream stats. The actual polling + watch-hours
// accumulation runs in the backend (see youtubeStats.ts) so that any number of
// open dashboards read one shared figure instead of each driving the integral.
router.get("/stats", (_req: Request, res: Response) => {
  res.json(getLatestYouTubeStats());
});

export default router;
