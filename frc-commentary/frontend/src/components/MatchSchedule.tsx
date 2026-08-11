import React, { useEffect, useState, useCallback } from "react";
import { MatchInfo, Settings } from "../types";

function compLevelLabel(level: string) {
  switch (level) {
    case "qm": return "Qual";
    case "qf": return "Quarters";
    case "sf": return "Semis";
    case "f": return "Finals";
    default: return level.toUpperCase();
  }
}

export function MatchSchedule({ settings }: { settings: Settings }) {
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!settings.tbaApiKey || !settings.tbaEventKey || !settings.backendUrl) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${settings.backendUrl}/api/tba/matches`);
      url.searchParams.set("apiKey", settings.tbaApiKey);
      url.searchParams.set("eventKey", settings.tbaEventKey);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load matches");
      setMatches(data.matches);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [settings.tbaApiKey, settings.tbaEventKey, settings.backendUrl]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (!settings.tbaApiKey || !settings.tbaEventKey) {
    return <div className="empty-state">Add your TBA API key and event key in Settings to load the match schedule.</div>;
  }

  const upcoming = matches.filter((m) => !m.played);
  const firstUnplayedKey = upcoming[0]?.key;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="small-note">{loading ? "Refreshing…" : `${upcoming.length} upcoming`}</span>
        <button className="btn" onClick={load}>Refresh</button>
      </div>
      {error && <div className="error-text">{error}</div>}
      <div className="match-list">
        {upcoming.slice(0, 25).map((m) => (
          <div key={m.key} className={`match-row ${m.key === firstUnplayedKey ? "next" : ""}`}>
            <div className="match-label">
              {compLevelLabel(m.compLevel)}<br />#{m.matchNumber}
            </div>
            <div className="alliance red">
              {m.red.map((t) => (
                <div className="team-chip" key={t.number}>
                  <span className="num">{t.number}</span>
                  <span className="name">{t.name}</span>
                </div>
              ))}
            </div>
            <div className="alliance blue">
              {m.blue.map((t) => (
                <div className="team-chip" key={t.number}>
                  <span className="num">{t.number}</span>
                  <span className="name">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {upcoming.length === 0 && !loading && (
          <div className="empty-state">No upcoming matches found — schedule may not be published yet, or all matches are complete.</div>
        )}
      </div>
    </div>
  );
}
