import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

export interface AlertMessage {
  type: "alert";
  text: string;
  sentAt: number;
}

export function attachAlertsWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/alerts" });
  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    clients.add(ws);

    ws.on("message", (data) => {
      let msg: AlertMessage;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }
      if (msg.type !== "alert" || typeof msg.text !== "string") return;

      const payload = JSON.stringify({
        type: "alert",
        text: msg.text,
        sentAt: Date.now(),
      });

      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  return wss;
}
