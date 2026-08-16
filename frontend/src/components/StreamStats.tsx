import React from "react";
import { useYouTubeStats } from "../hooks/useYouTubeStats";

function formatWatchHours(hours: number): string {
  if (hours < 10) return hours.toFixed(1);
  return Math.round(hours).toLocaleString();
}

function formatCount(n: number): string {
  return n.toLocaleString();
}

// Live YouTube stream stats for the hosts: how many are watching right now,
// running watch hours, and total views. `compact` gives a slim inline row for
// the commentator status bar; the default is a panel-sized readout.
export function StreamStats({ compact = false }: { compact?: boolean }) {
  const stats = useYouTubeStats();

  if (!stats || !stats.configured) {
    if (compact) return null;
    return (
      <div className="empty-state">
        Add your YouTube Video ID and API key in Settings to show viewer stats.
      </div>
    );
  }

  const viewers = stats.concurrentViewers;

  return (
    <div className={compact ? "stream-stats compact" : "stream-stats"}>
      <div className="stream-stat">
        <div className="stream-stat-value">
          {stats.isLive && viewers != null ? formatCount(viewers) : "—"}
        </div>
        <div className="stream-stat-label">
          <span className={`status-dot ${stats.isLive ? "ok" : "warn"}`} />
          {stats.isLive ? "Watching now" : "Not live"}
        </div>
      </div>

      <div className="stream-stat">
        <div className="stream-stat-value">{formatWatchHours(stats.watchHours)}</div>
        <div className="stream-stat-label">Watch hours</div>
      </div>

      <div className="stream-stat">
        <div className="stream-stat-value">
          {stats.viewCount != null ? formatCount(stats.viewCount) : "—"}
        </div>
        <div className="stream-stat-label">Total views</div>
      </div>

      {stats.error && !compact && (
        <div className="small-note error-text" style={{ flexBasis: "100%", marginTop: 4 }}>
          {stats.error}
        </div>
      )}
    </div>
  );
}
