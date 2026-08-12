import React, { useState } from "react";
import { MatchInfo } from "../types";
import { compLevelLabel, matchDisplayNumber } from "../matchLabels";
import { ClickableTeam } from "./ClickableTeam";

interface MatchDetail {
  matchLabel: string;
  winnerTeam: string | null;
}

interface Grouped {
  team1: string;
  team2: string;
  team1Wins: number;
  team2Wins: number;
  matches: MatchDetail[];
}

function findHeadToHead(matches: MatchInfo[], current: MatchInfo): Grouped[] {
  const redNums = current.red.map((t) => t.number);
  const blueNums = current.blue.map((t) => t.number);
  const grouped = new Map<string, Grouped>();

  for (const m of matches) {
    if (m.key === current.key || !m.played) continue;
    const mRed = m.red.map((t) => t.number);
    const mBlue = m.blue.map((t) => t.number);

    for (const r of redNums) {
      for (const b of blueNums) {
        let team1Side: "red" | "blue" | null = null;
        let team2Side: "red" | "blue" | null = null;
        if (mRed.includes(r) && mBlue.includes(b)) {
          team1Side = "red";
          team2Side = "blue";
        } else if (mBlue.includes(r) && mRed.includes(b)) {
          team1Side = "blue";
          team2Side = "red";
        }
        if (!team1Side) continue;

        const key = `${r}-${b}`;
        let g = grouped.get(key);
        if (!g) {
          g = { team1: r, team2: b, team1Wins: 0, team2Wins: 0, matches: [] };
          grouped.set(key, g);
        }
        const winnerTeam = m.winner === team1Side ? r : m.winner === team2Side ? b : null;
        if (winnerTeam === r) g.team1Wins++;
        else if (winnerTeam === b) g.team2Wins++;

        g.matches.push({
          matchLabel: `${compLevelLabel(m.compLevel)} #${matchDisplayNumber(m)}`,
          winnerTeam,
        });
      }
    }
  }

  return Array.from(grouped.values()).sort(
    (a, b) => Number(a.team1) - Number(b.team1) || Number(a.team2) - Number(b.team2)
  );
}

export function HeadToHead({ matches, currentMatch }: { matches: MatchInfo[]; currentMatch: MatchInfo }) {
  const encounters = findHeadToHead(matches, currentMatch);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  if (encounters.length === 0) return null;

  return (
    <div className="head-to-head">
      <div className="head-to-head-title">Head to Head</div>
      {encounters.map((e) => {
        const key = `${e.team1}-${e.team2}`;
        const expanded = expandedKey === key;
        return (
          <div key={key}>
            <div className="head-to-head-row">
              <ClickableTeam number={e.team1} className="h2h-red" />
              <button
                type="button"
                className="head-to-head-score"
                onClick={() => setExpandedKey(expanded ? null : key)}
              >
                {e.team1Wins}-{e.team2Wins}
              </button>
              <ClickableTeam number={e.team2} className="h2h-blue" />
            </div>
            {expanded && (
              <div className="head-to-head-detail">
                {e.matches.map((m, i) => (
                  <div key={i} className="head-to-head-detail-row">
                    <span>{m.matchLabel}</span>
                    <span className="small-note">
                      {m.winnerTeam ? `${m.winnerTeam} won` : "no decisive winner"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
