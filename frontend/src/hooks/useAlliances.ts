import { useCallback, useEffect, useRef, useState } from "react";
import { AllianceEntry, Settings } from "../types";

export function useAlliances(settings: Settings) {
  const [alliances, setAlliances] = useState<AllianceEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const hasDataRef = useRef(false);

  const load = useCallback(async () => {
    if (!settings.tbaApiKey || !settings.tbaEventKey) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ apiKey: settings.tbaApiKey, eventKey: settings.tbaEventKey });
      const res = await fetch(`/api/tba/alliances?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load alliances");
      setAlliances(data.alliances);
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

  return { alliances, error, loading, lastUpdated, isStale: error !== null && hasDataRef.current, reload: load };
}
