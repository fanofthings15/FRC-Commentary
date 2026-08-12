import { useEffect, useRef, useState, useCallback } from "react";
import { AlertMessage } from "../types";
import { getAlertsWsUrl } from "../wsUtils";

// See wsUtils.ts for why this connects directly to the backend in dev
// instead of relying on Vite's proxy.
export function useAlertsSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastAlert, setLastAlert] = useState<AlertMessage | null>(null);

  useEffect(() => {
    const wsUrl = getAlertsWsUrl();

    let cancelled = false;
    let socket: WebSocket;

    function connect() {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => setConnected(true);
      socket.onclose = () => {
        setConnected(false);
        if (!cancelled) setTimeout(connect, 2000);
      };
      socket.onerror = () => socket.close();
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "alert") setLastAlert(msg);
        } catch {
          // ignore malformed message
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, []);

  const sendAlert = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "alert", text }));
    }
  }, []);

  return { connected, lastAlert, sendAlert };
}
