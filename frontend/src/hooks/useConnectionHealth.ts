import { useEffect, useState } from "react";
import { Settings } from "../types";

export type HealthStatus = "ok" | "bad" | "unset" | "checking";

export function useConnectionHealth(settings: Settings) {
  const [backend, setBackend] = useState<HealthStatus>("checking");
  const [tba, setTba] = useState<HealthStatus>("checking");
  const [vmix, setVmix] = useState<HealthStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const r = await fetch("/api/health");
        if (!cancelled) setBackend(r.ok ? "ok" : "bad");
      } catch {
        if (!cancelled) setBackend("bad");
      }

      if (!settings.tbaApiKey || !settings.tbaEventKey) {
        if (!cancelled) setTba("unset");
      } else {
        try {
          const params = new URLSearchParams({ apiKey: settings.tbaApiKey, eventKey: settings.tbaEventKey });
          const r = await fetch(`/api/tba/rankings?${params.toString()}`);
          if (!cancelled) setTba(r.ok ? "ok" : "bad");
        } catch {
          if (!cancelled) setTba("bad");
        }
      }

      if (!settings.vmixHost) {
        if (!cancelled) setVmix("unset");
      } else {
        try {
          const params = new URLSearchParams({ host: settings.vmixHost, port: settings.vmixPort || "8088" });
          const r = await fetch(`/api/vmix/status?${params.toString()}`);
          if (!cancelled) setVmix(r.ok ? "ok" : "bad");
        } catch {
          if (!cancelled) setVmix("bad");
        }
      }
    }

    check();
    const interval = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [settings.tbaApiKey, settings.tbaEventKey, settings.vmixHost, settings.vmixPort]);

  return { backend, tba, vmix };
}
