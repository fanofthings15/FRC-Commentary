import { useCallback, useEffect, useRef, useState } from "react";
import { RankingEntry, Settings } from "../types";

export function useRankings(settings: Settings) {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const hasDataRef = useRef(false);

  const load = useCallback(async () => {
    if (!settings.tbaApiKey || !settings.tbaEventKey) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ apiKey: settings.tbaApiKey, eventKey: settings.tbaEventKey });
      const res = await fetch(`/api/tba/rankings?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load rankings");
      setRankings(data.rankings);
      setError(null);
      setLastUpdated(Date.now());
      hasDataRef.current = true;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [settings.tbaApiKey, settings.tbaEventKey]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  return { rankings, error, loading, lastUpdated, isStale: error !== null && hasDataRef.current, reload: load };
}
