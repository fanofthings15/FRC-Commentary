import React from "react";
import { timeAgo } from "../timeUtils";

export function StaleBanner({ lastUpdated }: { lastUpdated: number | null }) {
  return (
    <div className="stale-banner">
      <span className="status-dot warn" />
      Couldn't refresh{lastUpdated ? ` — showing data from ${timeAgo(lastUpdated)}` : ""}
    </div>
  );
}
