import { useEffect, useRef, useState, useCallback } from "react";
import { AlertMessage } from "../types";

export function useAlertsSocket(backendUrl: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastAlert, setLastAlert] = useState<AlertMessage | null>(null);

  useEffect(() => {
    if (!backendUrl) return;

    let wsUrl: string;
    try {
      const u = new URL(backendUrl);
      const proto = u.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${proto}//${u.host}/ws/alerts`;
    } catch {
      return;
    }

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
  }, [backendUrl]);

  const sendAlert = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "alert", text }));
    }
  }, []);

  return { connected, lastAlert, sendAlert };
}
