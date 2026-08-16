import React, { useState } from "react";
import { HashRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { useSettings } from "./hooks/useSettings";
import { useBigUi } from "./hooks/useBigUi";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { YouTubeChat } from "./components/YouTubeChat";
import { StreamStats } from "./components/StreamStats";
import { MatchSchedule } from "./components/MatchSchedule";
import { VmixStatus } from "./components/VmixStatus";
import { AlertsPanel } from "./components/AlertsPanel";
import { CommentatorView } from "./components/CommentatorView";
import { TeamPopupProvider } from "./context/TeamPopupContext";
import { EventQuickSwitch } from "./components/EventQuickSwitch";
import { ConnectionHealthStrip } from "./components/ConnectionHealthStrip";

function TopBar({
  settings,
  onChangeSettings,
  onOpenSettings,
  bigUi,
  onToggleBigUi,
}: {
  settings: ReturnType<typeof useSettings>["settings"];
  onChangeSettings: (partial: Partial<ReturnType<typeof useSettings>["settings"]>) => void;
  onOpenSettings: () => void;
  bigUi: boolean;
  onToggleBigUi: () => void;
}) {
  const location = useLocation();
  return (
    <div className="topbar">
      <div className="brand">
        <span className="tally" />
        FRC COMMENTARY
      </div>
      <ConnectionHealthStrip settings={settings} />
      <EventQuickSwitch settings={settings} onChange={onChangeSettings} />
      <nav>
        <Link className={location.pathname === "/" ? "active" : ""} to="/">Dashboard</Link>
        <Link className={location.pathname === "/commentator" ? "active" : ""} to="/commentator">Commentator View</Link>
        <button
          className={bigUi ? "active" : ""}
          onClick={onToggleBigUi}
          title="Scale up text and controls for a docked or distant screen"
        >
          {bigUi ? "Big UI: On" : "Big UI"}
        </button>
        <button onClick={onOpenSettings}>Settings</button>
      </nav>
    </div>
  );
}

function Dashboard({ settings }: { settings: ReturnType<typeof useSettings>["settings"] }) {
  return (
    <div className="main-grid">
      <div className="col">
        <div className="panel">
          <div className="panel-header"><h2>Stream Stats</h2></div>
          <div className="panel-body">
            <StreamStats />
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><h2>Stream Chat</h2></div>
          <div className="panel-body" style={{ padding: 0 }}>
            <YouTubeChat videoId={settings.youtubeVideoId} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><h2>Send Alert to Commentators</h2></div>
          <div className="panel-body">
            <AlertsPanel settings={settings} />
          </div>
        </div>
      </div>

      <div className="col">
        <div className="panel">
          <div className="panel-header"><h2>Upcoming Matches</h2></div>
          <div className="panel-body">
            <MatchSchedule settings={settings} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><h2>vMix — Program / Preview / Sources</h2></div>
          <div className="panel-body">
            <VmixStatus settings={settings} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { settings, updateSettings } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bigUi, setBigUi] = useBigUi();

  return (
    <HashRouter>
      <TeamPopupProvider settings={settings}>
        <div className={bigUi ? "app-shell big-ui" : "app-shell"}>
          <Routes>
            <Route
              path="/commentator"
              element={
                <CommentatorView
                  settings={settings}
                  onChangeSettings={updateSettings}
                  bigUi={bigUi}
                  onToggleBigUi={() => setBigUi((v) => !v)}
                />
              }
            />
            <Route
              path="/"
              element={
                <>
                  <TopBar
                    settings={settings}
                    onChangeSettings={updateSettings}
                    onOpenSettings={() => setSettingsOpen(true)}
                    bigUi={bigUi}
                    onToggleBigUi={() => setBigUi((v) => !v)}
                  />
                  <Dashboard settings={settings} />
                </>
              }
            />
          </Routes>

          {settingsOpen && (
            <SettingsDrawer
              settings={settings}
              onChange={updateSettings}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </div>
      </TeamPopupProvider>
    </HashRouter>
  );
}
