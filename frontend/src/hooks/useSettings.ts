import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SETTINGS, Settings } from "../types";

const STORAGE_KEY = "frc-commentary:settings";

// Settings live on the backend now (encrypted at rest — see backend/src/settingsStore.ts),
// so they're shared across every browser/device pointed at the same backend
// instead of being scoped to one browser's origin. localStorage is kept only
// as an instant local cache, so the UI doesn't flash empty fields for the
// split second before the backend responds.
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [loaded, setLoaded] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the real (backend) copy once on mount — this is the source of truth.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.settings) {
          setSettings((prev) => ({ ...DEFAULT_SETTINGS, ...prev, ...data.settings }));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true)); // backend unreachable — fall back to local cache silently
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the local cache in sync, and push changes to the backend (debounced
  // so rapid typing in Settings doesn't fire a request per keystroke).
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    if (!loaded) return; // don't push back the initial (possibly stale) local cache before the real load lands
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }).catch(() => {
        // offline/backend unreachable — settings still work locally via the cache above
      });
    }, 500);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [settings, loaded]);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => {
      let next = { ...prev, ...partial };
      // Whenever the active event actually changes, remember the one we're
      // leaving so the quick-switch has somewhere to switch back to.
      if (
        partial.tbaEventKey &&
        partial.tbaEventKey !== prev.tbaEventKey &&
        prev.tbaEventKey
      ) {
        const history = [
          prev.tbaEventKey,
          ...prev.recentEventKeys.filter((k) => k !== prev.tbaEventKey && k !== partial.tbaEventKey),
        ].slice(0, 5);
        next = { ...next, recentEventKeys: history };
      }
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
