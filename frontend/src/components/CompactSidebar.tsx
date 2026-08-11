import React from "react";
import { Settings } from "../types";
import { YouTubeChat } from "./YouTubeChat";
import { MatchBrowser } from "./MatchBrowser";

// Matches on top, chat pinned to the bottom half — both always visible,
// no tab-switching needed.
export function CompactSidebar({ settings }: { settings: Settings }) {
  return (
    <div className="commentator-sidebar-stack">
      <div className="panel sidebar-half">
        <div className="panel-header"><h2>Matches</h2></div>
        <div className="panel-body sidebar-half-body">
          <MatchBrowser settings={settings} />
        </div>
      </div>

      <div className="panel sidebar-half">
        <div className="panel-header"><h2>Chat</h2></div>
        <div className="panel-body sidebar-half-body" style={{ padding: 0 }}>
          <YouTubeChat videoId={settings.youtubeVideoId} height="100%" />
        </div>
      </div>
    </div>
  );
}
