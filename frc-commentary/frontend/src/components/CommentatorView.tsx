import React, { useEffect, useState } from "react";
import { Settings } from "../types";
import { useAlertsSocket } from "../hooks/useAlertsSocket";

export function CommentatorView({ settings }: { settings: Settings }) {
  const { connected, lastAlert } = useAlertsSocket(settings.backendUrl);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastAlert) return;
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timeout);
  }, [lastAlert]);

  return (
    <div className="commentator-view">
      {visible && lastAlert ? (
        <div className="alert-banner">{lastAlert.text}</div>
      ) : (
        <div className="idle">
          <span className={`status-dot ${connected ? "ok" : "bad"}`} />
          {connected ? "Waiting for messages from the producer…" : "Not connected — check Settings on this device"}
        </div>
      )}
    </div>
  );
}
