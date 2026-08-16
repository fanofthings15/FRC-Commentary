import { useEffect, useState } from "react";

// The running app version, as reported by the backend's /api/health (which
// reads it from package.json - see backend/src/autoUpdater.ts). Fetched once;
// this never changes without a restart, so there's no reason to poll it.
export function useAppVersion(): string | null {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data?.version === "string") setVersion(data.version);
      })
      .catch(() => {
        // backend unreachable - leave it unset rather than showing something wrong
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return version;
}
