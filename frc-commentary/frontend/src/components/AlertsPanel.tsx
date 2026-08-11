import React, { useState } from "react";
import { Settings } from "../types";
import { useAlertsSocket } from "../hooks/useAlertsSocket";

const PRESETS = ["Wrap Up", "Go to Break", "Match Starting", "Stand By", "All Clear"];

export function AlertsPanel({ settings }: { settings: Settings }) {
  const { connected, sendAlert, lastAlert } = useAlertsSocket(settings.backendUrl);
  const [custom, setCustom] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    sendAlert(text.trim());
    setCustom("");
  };

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <span className={`status-dot ${connected ? "ok" : "bad"}`} />
        <span className="small-note">{connected ? "Connected — commentators will see this instantly" : "Not connected to backend"}</span>
      </div>

      <div className="preset-grid">
        {PRESETS.map((p) => (
          <button key={p} className="btn primary" onClick={() => send(p)}>
            {p}
          </button>
        ))}
      </div>

      <div className="custom-alert-row">
        <input
          placeholder="Type a custom message…"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(custom)}
        />
        <button className="btn" onClick={() => send(custom)}>Send</button>
      </div>

      {lastAlert && (
        <p className="small-note" style={{ marginTop: 10 }}>
          Last sent: "{lastAlert.text}" at {new Date(lastAlert.sentAt).toLocaleTimeString()}
        </p>
      )}

      <p className="small-note" style={{ marginTop: 6 }}>
        Open <code>/commentator</code> on the commentator's screen to display these as a full-screen banner.
      </p>
    </div>
  );
}
