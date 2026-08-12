import React, { useEffect, useMemo, useState } from "react";
import { Settings } from "../types";
import { useMatches } from "../hooks/useMatches";
import { compLevelLabel } from "../matchLabels";
import { RankingsTable } from "./RankingsTable";
import { PlayoffBracket } from "./PlayoffBracket";
import { AlliancesList } from "./AlliancesList";

type Tab = "match" | "rankings" | "playoffs" | "alliances";

export function MatchBrowser({ settings }: { settings: Settings }) {
  const { matches, error, loading, reload } = useMatches(settings);
  const [index, setIndex] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("match");

  // Default cursor: the first unplayed match, or the last match if everything's played.
  const defaultIndex = useMemo(() => {
    if (matches.length === 0) return 0;
    const firstUnplayed = matches.findIndex((m) => !m.played);
    return firstUnplayed === -1 ? matches.length - 1 : firstUnplayed;
  }, [matches]);

  useEffect(() => {
    setIndex((prev) => (prev === null ? defaultIndex : prev));
  }, [defaultIndex]);

  if (!settings.tbaApiKey || !settings.tbaEventKey) {
    return <div className="empty-state">Add your TBA API key and event key in Settings to load matches.</div>;
  }

  if (loading && matches.length === 0) {
    return <div className="empty-state">Loading matches…</div>;
  }

  if (error && matches.length === 0) {
    return <div className="error-text">{error}</div>;
  }

  if (matches.length === 0) {
    return <div className="empty-state">No matches found for this event yet.</div>;
  }

  const i = index ?? defaultIndex;
  const match = matches[i];
  const isCurrent = i === defaultIndex;
  const redNumbers = match.red.map((t) => t.number);
  const blueNumbers = match.blue.map((t) => t.number);

  return (
    <div>
      <div className="browser-tabs">
        <button className={tab === "match" ? "active" : ""} onClick={() => setTab("match")}>
          Teams
        </button>
        <button className={tab === "rankings" ? "active" : ""} onClick={() => setTab("rankings")}>
          Rankings
        </button>
        <button className={tab === "playoffs" ? "active" : ""} onClick={() => setTab("playoffs")}>
          Playoffs
        </button>
        <button className={tab === "alliances" ? "active" : ""} onClick={() => setTab("alliances")}>
          Alliances
        </button>
      </div>

      {tab === "match" ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0 10px" }}>
            <span className="small-note">
              Match {i + 1} of {matches.length}
              {isCurrent ? " · up next" : match.played ? " · viewing a past result" : " · viewing ahead"}
            </span>
            <button className="btn" onClick={reload}>Refresh</button>
          </div>

          <div className="match-browser-card">
            <div className="match-browser-label">
              {compLevelLabel(match.compLevel)} #{match.matchNumber}
              {match.played && match.winner && (
                <span className={`badge ${match.winner === "red" ? "program" : "preview"}`} style={{ marginLeft: 8 }}>
                  {match.winner.toUpperCase()} WON
                </span>
              )}
            </div>

            <div className="match-browser-alliances">
              <div className="match-browser-alliance red">
                {match.red.map((t) => (
                  <div key={t.number} className="match-browser-team">
                    <div className="match-browser-team-main">
                      <span className="num">{t.number}</span>
                      <span className="name">{t.name}</span>
                    </div>
                    {t.hometown && <span className="hometown">{t.hometown}</span>}
                  </div>
                ))}
              </div>
              <div className="match-browser-vs">VS</div>
              <div className="match-browser-alliance blue">
                {match.blue.map((t) => (
                  <div key={t.number} className="match-browser-team">
                    <div className="match-browser-team-main">
                      <span className="num">{t.number}</span>
                      <span className="name">{t.name}</span>
                    </div>
                    {t.hometown && <span className="hometown">{t.hometown}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="match-browser-nav">
            <button className="btn" disabled={i === 0} onClick={() => setIndex(Math.max(0, i - 1))}>
              ← Previous Match
            </button>
            <button className="btn" onClick={() => setIndex(defaultIndex)} disabled={isCurrent}>
              Jump to Current
            </button>
            <button className="btn" disabled={i === matches.length - 1} onClick={() => setIndex(Math.min(matches.length - 1, i + 1))}>
              Next Match →
            </button>
          </div>
        </>
      ) : tab === "rankings" ? (
        <RankingsTable settings={settings} redTeams={redNumbers} blueTeams={blueNumbers} />
      ) : tab === "playoffs" ? (
        <PlayoffBracket matches={matches} />
      ) : (
        <AlliancesList settings={settings} />
      )}
    </div>
  );
}
