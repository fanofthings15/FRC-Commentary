import React, { useMemo, useState } from "react";
import { Settings } from "../types";
import { useRankings } from "../hooks/useRankings";
import { useOprs } from "../hooks/useOprs";
import { ClickableTeam } from "./ClickableTeam";
import { StaleBanner } from "./StaleBanner";

type SortKey = "rank" | "team" | "opr";
type SortDir = "asc" | "desc";

export function RankingsTable({
  settings,
  redTeams,
  blueTeams,
}: {
  settings: Settings;
  redTeams: string[];
  blueTeams: string[];
}) {
  const { rankings, error, loading, lastUpdated, isStale, reload } = useRankings(settings);
  const { oprs } = useOprs(settings);
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const oprByTeam = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of oprs) if (o.opr !== null) map.set(o.teamNumber, o.opr);
    return map;
  }, [oprs]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const arr = [...rankings];
    arr.sort((a, b) => {
      let av: number;
      let bv: number;
      if (sortKey === "rank") {
        av = a.rank;
        bv = b.rank;
      } else if (sortKey === "team") {
        av = Number(a.teamNumber);
        bv = Number(b.teamNumber);
      } else {
        av = oprByTeam.get(a.teamNumber) ?? -Infinity;
        bv = oprByTeam.get(b.teamNumber) ?? -Infinity;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [rankings, sortKey, sortDir, oprByTeam]);

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

  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  return (
    <div>
      {isStale && <StaleBanner lastUpdated={lastUpdated} />}

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="small-note">{loading ? "Refreshing…" : `${rankings.length} teams`}</span>
        <button className="btn" onClick={reload}>Refresh</button>
      </div>

      <div className="rankings-table">
        <div className="rankings-row rankings-head">
          <button className="rankings-sort-btn" onClick={() => toggleSort("rank")}>Rank{arrow("rank")}</button>
          <button className="rankings-sort-btn" onClick={() => toggleSort("team")}>Team{arrow("team")}</button>
          <button className="rankings-sort-btn rankings-sort-btn-right" onClick={() => toggleSort("opr")}>OPR{arrow("opr")}</button>
          <span>W-L-T</span>
        </div>
        {sorted.map((r) => {
          const isRed = redTeams.includes(r.teamNumber);
          const isBlue = blueTeams.includes(r.teamNumber);
          const cls = isRed ? "red" : isBlue ? "blue" : "";
          const opr = oprByTeam.get(r.teamNumber);
          return (
            <div key={r.teamNumber} className={`rankings-row ${cls}`}>
              <span className="rankings-rank">{r.rank}</span>
              <span className="rankings-team"><ClickableTeam number={r.teamNumber} /></span>
              <span className="rankings-opr">{opr !== undefined ? opr.toFixed(1) : "–"}</span>
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
