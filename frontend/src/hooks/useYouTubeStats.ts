import { useCallback, useEffect, useState } from "react";
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

  // Corrects the accumulated watch-hours total. The backend replies with the
  // full updated stats, which we apply directly so the UI reflects the fix
  // immediately rather than waiting for the next 5s poll. Returns an error
  // message on failure (e.g. no stream tracked yet), or null on success.
  const setWatchHours = useCallback(async (hours: number): Promise<string | null> => {
    try {
      const res = await fetch("/api/youtube/watch-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      const data = await res.json();
      if (!res.ok) return data?.error || "Could not set watch hours.";
      setStats(data);
      return null;
    } catch (err: any) {
      return `Could not reach the backend. (${err.message})`;
    }
  }, []);

  return { stats, setWatchHours };
}
