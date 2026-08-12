import { useCallback, useEffect, useRef, useState } from "react";
import { MatchInfo, Settings } from "../types";

export function useMatches(settings: Settings) {
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const hasDataRef = useRef(false);

  const load = useCallback(async () => {
    if (!settings.tbaApiKey || !settings.tbaEventKey) return;
    setLoading(true);
    // Don't clear the error here - if this fetch also fails, the old error
    // (or the stale data) should keep showing rather than flash to blank.
    try {
      const params = new URLSearchParams({ apiKey: settings.tbaApiKey, eventKey: settings.tbaEventKey });
      const res = await fetch(`/api/tba/matches?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load matches");
      setMatches(data.matches);
      setError(null);
      setLastUpdated(Date.now());
      hasDataRef.current = true;
    } catch (err: any) {
      // Keep whatever data we already had (if any) - only surface the error
      // as a hard blocker when there's nothing to fall back to.
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

  return { matches, error, loading, lastUpdated, isStale: error !== null && hasDataRef.current, reload: load };
}
