import express from "express";
import cors from "cors";
import http from "http";
import vmixRouter from "./routes/vmix";
import tbaRouter from "./routes/tba";
import { attachAlertsWebSocket } from "./ws/alerts";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/vmix", vmixRouter);
app.use("/api/tba", tbaRouter);

const server = http.createServer(app);
attachAlertsWebSocket(server);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
server.listen(PORT, () => {
  console.log(`FRC Commentary backend listening on http://localhost:${PORT}`);
  console.log(`Alerts WebSocket at ws://localhost:${PORT}/ws/alerts`);
});
