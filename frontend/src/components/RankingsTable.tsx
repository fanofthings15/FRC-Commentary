import React from "react";
import { Settings } from "../types";
import { useRankings } from "../hooks/useRankings";

export function RankingsTable({
  settings,
  redTeams,
  blueTeams,
}: {
  settings: Settings;
  redTeams: string[];
  blueTeams: string[];
}) {
  const { rankings, error, loading, reload } = useRankings(settings);

  if (!settings.tbaApiKey || !settings.tbaEventKey) {
    return <div className="empty-state">Add your TBA API key and event key in Settings to load rankings.</div>;
  }

  if (loading && rankings.length === 0) {
    return <div className="empty-state">Loading rankings…</div>;
  }

  if (error && rankings.length === 0) {
    return <div className="error-text">{error}</div>;
  }

  if (rankings.length === 0) {
    return <div className="empty-state">No rankings published yet for this event.</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="small-note">{loading ? "Refreshing…" : `${rankings.length} teams`}</span>
        <button className="btn" onClick={reload}>Refresh</button>
      </div>

      <div className="rankings-table">
        <div className="rankings-row rankings-head">
          <span>Rank</span>
          <span>Team</span>
          <span>W-L-T</span>
        </div>
        {rankings.map((r) => {
          const isRed = redTeams.includes(r.teamNumber);
          const isBlue = blueTeams.includes(r.teamNumber);
          const cls = isRed ? "red" : isBlue ? "blue" : "";
          return (
            <div key={r.teamNumber} className={`rankings-row ${cls}`}>
              <span className="rankings-rank">{r.rank}</span>
              <span className="rankings-team">{r.teamNumber}</span>
              <span className="rankings-record">
                {r.wins ?? "–"}-{r.losses ?? "–"}-{r.ties ?? "–"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
