import React from "react";
import { MatchInfo } from "../types";
import { compLevelLabel, matchDisplayNumber } from "../matchLabels";
import { ClickableTeam } from "./ClickableTeam";

interface Encounter {
  matchLabel: string;
  team1: string;
  team2: string;
  winnerTeam: string | null; // the specific team number that won, if decided
}

function findHeadToHead(matches: MatchInfo[], current: MatchInfo): Encounter[] {
  const redNums = current.red.map((t) => t.number);
  const blueNums = current.blue.map((t) => t.number);
  const encounters: Encounter[] = [];

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
        if (team1Side) {
          const winnerTeam = m.winner === team1Side ? r : m.winner === team2Side ? b : null;
          encounters.push({
            matchLabel: `${compLevelLabel(m.compLevel)} #${matchDisplayNumber(m)}`,
            team1: r,
            team2: b,
            winnerTeam,
          });
        }
      }
    }
  }

  return encounters.slice(0, 6);
}

export function HeadToHead({ matches, currentMatch }: { matches: MatchInfo[]; currentMatch: MatchInfo }) {
  const encounters = findHeadToHead(matches, currentMatch);

  if (encounters.length === 0) return null;

  return (
    <div className="head-to-head">
      <div className="head-to-head-title">These teams have met before this event</div>
      {encounters.map((e, i) => (
        <div key={i} className="head-to-head-row">
          <span>
            <ClickableTeam number={e.team1} /> vs <ClickableTeam number={e.team2} />
          </span>
          <span className="small-note">
            {e.matchLabel}
            {e.winnerTeam && ` · ${e.winnerTeam} won`}
          </span>
        </div>
      ))}
    </div>
  );
}
