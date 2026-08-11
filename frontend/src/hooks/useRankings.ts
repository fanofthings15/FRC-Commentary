import { useCallback, useEffect, useState } from "react";
import { RankingEntry, Settings } from "../types";

export function useRankings(settings: Settings) {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!settings.tbaApiKey || !settings.tbaEventKey || !settings.backendUrl) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${settings.backendUrl}/api/tba/rankings`);
      url.searchParams.set("apiKey", settings.tbaApiKey);
      url.searchParams.set("eventKey", settings.tbaEventKey);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load rankings");
      setRankings(data.rankings);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [settings.tbaApiKey, settings.tbaEventKey, settings.backendUrl]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  return { rankings, error, loading, reload: load };
}
