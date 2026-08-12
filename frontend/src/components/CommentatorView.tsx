import React, { useEffect, useState } from "react";
import { Settings } from "../types";
import { useAlertsSocket } from "../hooks/useAlertsSocket";
import { useMatches } from "../hooks/useMatches";
import { TelestratorLauncher } from "./TelestratorLauncher";
import { YouTubeChat } from "./YouTubeChat";
import { MatchBrowser } from "./MatchBrowser";
import { OnDeckTicker } from "./OnDeckTicker";
import { EventQuickSwitch } from "./EventQuickSwitch";

export function CommentatorView({
  settings,
  onChangeSettings,
}: {
  settings: Settings;
  onChangeSettings: (partial: Partial<Settings>) => void;
}) {
  const { connected, lastAlert } = useAlertsSocket();
  const { matches } = useMatches(settings);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastAlert) return;
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timeout);
  }, [lastAlert]);

  return (
    <div className="commentator-shell">
      <div className="commentator-status-bar">
        <span>
          <span className={`status-dot ${connected ? "ok" : "bad"}`} />
          {connected ? "Connected to producer" : "Not connected — check Settings"}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <EventQuickSwitch settings={settings} onChange={onChangeSettings} />
          <span className="small-note">Commentator View</span>
        </span>
      </div>

      {visible && lastAlert && (
        <div className="alert-overlay">
          <div className="alert-banner-inline">{lastAlert.text}</div>
          <button className="btn" onClick={() => setVisible(false)}>Dismiss</button>
        </div>
      )}

      <OnDeckTicker matches={matches} />

      <div className="panel commentator-toolbar-panel">
        <TelestratorLauncher settings={settings} />
      </div>

      <div className="commentator-grid">
        <div className="panel commentator-half">
          <div className="panel-body" style={{ padding: 0, flex: 1 }}>
            <YouTubeChat videoId={settings.youtubeVideoId} height="100%" />
          </div>
        </div>

        <div className="panel commentator-half">
          <div className="panel-body" style={{ flex: 1, overflowY: "auto" }}>
            <MatchBrowser settings={settings} />
          </div>
        </div>
      </div>
    </div>
  );
}
