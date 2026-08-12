import React from "react";
import { MatchInfo } from "../types";
import { compLevelLabel, matchDisplayNumber } from "../matchLabels";

export function OnDeckTicker({ matches }: { matches: MatchInfo[] }) {
  const upcoming = matches.filter((m) => !m.played).slice(0, 4);

  if (upcoming.length === 0) return null;

  return (
    <div className="on-deck-ticker">
      <span className="on-deck-label">On deck</span>
      <div className="on-deck-items">
        {upcoming.map((m, i) => (
          <div key={m.key} className={`on-deck-item ${i === 0 ? "next" : ""}`}>
            <span className="on-deck-match-label">
              {compLevelLabel(m.compLevel)} #{matchDisplayNumber(m)}
            </span>
            <span className="on-deck-teams red">{m.red.map((t) => t.number).join(" ")}</span>
            <span className="on-deck-teams blue">{m.blue.map((t) => t.number).join(" ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
