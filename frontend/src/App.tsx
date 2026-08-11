import React, { useState } from "react";
import { HashRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { useSettings } from "./hooks/useSettings";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { YouTubeChat } from "./components/YouTubeChat";
import { MatchSchedule } from "./components/MatchSchedule";
import { VmixStatus } from "./components/VmixStatus";
import { AlertsPanel } from "./components/AlertsPanel";
import { CommentatorView } from "./components/CommentatorView";

function TopBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const location = useLocation();
  return (
    <div className="topbar">
      <div className="brand">
        <span className="tally" />
        FRC COMMENTARY
      </div>
      <nav>
        <Link className={location.pathname === "/" ? "active" : ""} to="/">Dashboard</Link>
        <Link className={location.pathname === "/commentator" ? "active" : ""} to="/commentator">Commentator View</Link>
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

  return (
    <HashRouter>
      <div className="app-shell">
        <Routes>
          <Route
            path="/commentator"
            element={<CommentatorView settings={settings} />}
          />
          <Route
            path="/"
            element={
              <>
                <TopBar onOpenSettings={() => setSettingsOpen(true)} />
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
    </HashRouter>
  );
}
