import React, { useState } from "react";
import { Settings } from "../types";
import { YouTubeChat } from "./YouTubeChat";
import { MatchBrowser } from "./MatchBrowser";

type Tab = "chat" | "matches";

export function CompactSidebar({ settings }: { settings: Settings }) {
  const [tab, setTab] = useState<Tab>("matches");

  return (
    <div className="panel commentator-sidebar">
      <div className="sidebar-tabs">
        <button className={tab === "matches" ? "active" : ""} onClick={() => setTab("matches")}>
          Matches
        </button>
        <button className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}>
          Chat
        </button>
      </div>
      <div className="panel-body sidebar-body">
        {tab === "matches" ? (
          <MatchBrowser settings={settings} />
        ) : (
          <YouTubeChat videoId={settings.youtubeVideoId} height="100%" />
        )}
      </div>
    </div>
  );
}
