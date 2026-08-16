import { useEffect, useState } from "react";
import { StreamStats } from "../types";

// Polls the backend's cached YouTube stream stats. The backend owns the actual
// YouTube API polling and watch-hours accumulation (see backend/youtubeStats.ts),
// so this just refreshes the display a few times a minute.
export function useYouTubeStats() {
  const [stats, setStats] = useState<StreamStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/youtube/stats");
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch {
        // backend unreachable — keep showing the last known values
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return stats;
}
