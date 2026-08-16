import React, { useEffect, useState } from "react";
import { Settings } from "../types";
import { useAlertsSocket } from "../hooks/useAlertsSocket";
import { useMatches } from "../hooks/useMatches";
import { TelestratorLauncher } from "./TelestratorLauncher";
import { YouTubeChat } from "./YouTubeChat";
import { MatchBrowser } from "./MatchBrowser";
import { OnDeckTicker } from "./OnDeckTicker";
import { EventQuickSwitch } from "./EventQuickSwitch";
import { ConnectionHealthStrip } from "./ConnectionHealthStrip";
import { StreamStats } from "./StreamStats";

export function CommentatorView({
  settings,
  onChangeSettings,
  bigUi,
  onToggleBigUi,
}: {
  settings: Settings;
  onChangeSettings: (partial: Partial<Settings>) => void;
  bigUi: boolean;
  onToggleBigUi: () => void;
}) {
  const { lastAlert } = useAlertsSocket();
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
        <ConnectionHealthStrip settings={settings} />
        <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <EventQuickSwitch settings={settings} onChange={onChangeSettings} />
          <button
            className={bigUi ? "btn active" : "btn"}
            onClick={onToggleBigUi}
            title="Scale up text and controls for a docked or distant screen"
          >
            {bigUi ? "Big UI: On" : "Big UI"}
          </button>
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

      <StreamStats compact />

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
