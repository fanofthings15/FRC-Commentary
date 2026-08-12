import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { incomingAlertSchema, type AlertMessage } from "frc-commentary-shared";

export function attachAlertsWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/alerts" });
  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    clients.add(ws);

    ws.on("message", (data) => {
      let raw: unknown;
      try {
        raw = JSON.parse(data.toString());
      } catch {
        return;
      }
      // Only accept well-formed { type: "alert", text } messages; ignore
      // anything else rather than trusting the socket.
      const parsed = incomingAlertSchema.safeParse(raw);
      if (!parsed.success) return;

      const message: AlertMessage = {
        type: "alert",
        text: parsed.data.text,
        sentAt: Date.now(),
      };
      const payload = JSON.stringify(message);

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
