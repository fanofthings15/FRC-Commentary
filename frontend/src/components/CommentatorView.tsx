import React, { useEffect, useState } from "react";
import { Settings, resolveTelestratorUrl } from "../types";
import { useAlertsSocket } from "../hooks/useAlertsSocket";
import { TelestratorFrame } from "./TelestratorFrame";
import { CompactSidebar } from "./CompactSidebar";

export function CommentatorView({ settings }: { settings: Settings }) {
  const { connected, lastAlert } = useAlertsSocket(settings.backendUrl);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastAlert) return;
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timeout);
  }, [lastAlert]);

  const telestratorUrl = resolveTelestratorUrl(settings);

  return (
    <div className="commentator-shell">
      <div className="commentator-status-bar">
        <span>
          <span className={`status-dot ${connected ? "ok" : "bad"}`} />
          {connected ? "Connected to producer" : "Not connected — check Settings"}
        </span>
        <span className="small-note">Commentator View</span>
      </div>

      {visible && lastAlert && (
        <div className="alert-overlay">
          <div className="alert-banner-inline">{lastAlert.text}</div>
          <button className="btn" onClick={() => setVisible(false)}>Dismiss</button>
        </div>
      )}

      <div className="commentator-grid">
        <div className="panel commentator-main">
          <div className="panel-header"><h2>Telestrator</h2></div>
          <div className="panel-body" style={{ padding: 0, flex: 1 }}>
            <TelestratorFrame url={telestratorUrl} />
          </div>
        </div>

        <CompactSidebar settings={settings} />
      </div>
    </div>
  );
}
