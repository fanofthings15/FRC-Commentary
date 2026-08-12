import { useEffect, useRef, useState, useCallback } from "react";
import { AlertMessage } from "../types";

// Connects to the alerts WebSocket on the app's own origin — same host in
// prod (the backend serves both the UI and this socket), proxied through
// Vite in dev (see vite.config.ts's /ws proxy entry).
export function useAlertsSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastAlert, setLastAlert] = useState<AlertMessage | null>(null);

  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${window.location.host}/ws/alerts`;

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
