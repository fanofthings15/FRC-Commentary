import React from "react";
import { Settings } from "../types";
import { useMatches } from "../hooks/useMatches";
import { compLevelLabel, matchDisplayNumber } from "../matchLabels";
import { ClickableTeam } from "./ClickableTeam";

export function MatchSchedule({ settings }: { settings: Settings }) {
  const { matches, error, loading, reload } = useMatches(settings);

  if (!settings.tbaApiKey || !settings.tbaEventKey) {
    return <div className="empty-state">Add your TBA API key and event key in Settings to load the match schedule.</div>;
  }

  const upcoming = matches.filter((m) => !m.played);
  const firstUnplayedKey = upcoming[0]?.key;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="small-note">{loading ? "Refreshing…" : `${upcoming.length} upcoming`}</span>
        <button className="btn" onClick={reload}>Refresh</button>
      </div>
      {error && <div className="error-text">{error}</div>}
      <div className="match-list">
        {upcoming.slice(0, 25).map((m) => (
          <div key={m.key} className={`match-row ${m.key === firstUnplayedKey ? "next" : ""}`}>
            <div className="match-label">
              {compLevelLabel(m.compLevel)}<br />#{matchDisplayNumber(m)}
            </div>
            <div className="alliance red">
              {m.red.map((t) => (
                <div className="team-chip" key={t.number}>
                  <span className="num"><ClickableTeam number={t.number} /></span>
                  <span className="name">{t.name}</span>
                </div>
              ))}
            </div>
            <div className="alliance blue">
              {m.blue.map((t) => (
                <div className="team-chip" key={t.number}>
                  <span className="num"><ClickableTeam number={t.number} /></span>
                  <span className="name">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {upcoming.length === 0 && !loading && (
          <div className="empty-state">No upcoming matches — all matches are complete. Use the Match Browser on the Commentator View to step back through results.</div>
        )}
      </div>
    </div>
  );
}
