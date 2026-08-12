import { useEffect, useState } from "react";
import { Settings } from "../types";
import { getAlertsWsUrl } from "../wsUtils";

export type HealthStatus = "ok" | "bad" | "unset" | "checking";

export function useConnectionHealth(settings: Settings) {
  const [backend, setBackend] = useState<HealthStatus>("checking");
  const [tba, setTba] = useState<HealthStatus>("checking");
  const [vmix, setVmix] = useState<HealthStatus>("checking");
  const [alerts, setAlerts] = useState<HealthStatus>("checking");

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

  // Alerts WebSocket - checked separately since it's a persistent connection,
  // not a periodic request like the others.
  useEffect(() => {
    const wsUrl = getAlertsWsUrl();
    let cancelled = false;
    let socket: WebSocket;

    function connect() {
      setAlerts((prev) => (prev === "ok" ? prev : "checking"));
      socket = new WebSocket(wsUrl);
      socket.onopen = () => {
        if (!cancelled) setAlerts("ok");
      };
      socket.onclose = () => {
        if (!cancelled) {
          setAlerts("bad");
          setTimeout(connect, 3000);
        }
      };
      socket.onerror = () => socket.close();
    }

    connect();
    return () => {
      cancelled = true;
      socket?.close();
    };
  }, []);

  return { backend, tba, vmix, alerts };
}
