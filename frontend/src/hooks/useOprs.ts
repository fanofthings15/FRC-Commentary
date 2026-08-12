import { useCallback, useEffect, useState } from "react";
import { OprEntry, Settings } from "../types";

export function useOprs(settings: Settings) {
  const [oprs, setOprs] = useState<OprEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!settings.tbaApiKey || !settings.tbaEventKey) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ apiKey: settings.tbaApiKey, eventKey: settings.tbaEventKey });
      const res = await fetch(`/api/tba/oprs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load OPR stats");
      setOprs(data.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [settings.tbaApiKey, settings.tbaEventKey]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  return { oprs, error, loading, reload: load };
}
