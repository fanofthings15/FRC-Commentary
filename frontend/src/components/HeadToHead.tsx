import React from "react";
import { MatchInfo } from "../types";
import { ClickableTeam } from "./ClickableTeam";

interface Grouped {
  team1: string;
  team2: string;
  team1Wins: number;
  team2Wins: number;
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
          g = { team1: r, team2: b, team1Wins: 0, team2Wins: 0 };
          grouped.set(key, g);
        }
        if (m.winner === team1Side) g.team1Wins++;
        else if (m.winner === team2Side) g.team2Wins++;
      }
    }
  }

  return Array.from(grouped.values());
}

export function HeadToHead({ matches, currentMatch }: { matches: MatchInfo[]; currentMatch: MatchInfo }) {
  const encounters = findHeadToHead(matches, currentMatch);

  if (encounters.length === 0) return null;

  return (
    <div className="head-to-head">
      <div className="head-to-head-title">These teams have met before this event</div>
      {encounters.map((e, i) => (
        <div key={i} className="head-to-head-row">
          <ClickableTeam number={e.team1} />
          <span className="head-to-head-score">{e.team1Wins}-{e.team2Wins}</span>
          <ClickableTeam number={e.team2} />
        </div>
      ))}
    </div>
  );
}
