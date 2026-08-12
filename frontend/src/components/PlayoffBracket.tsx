import React from "react";
import { MatchInfo } from "../types";
import { compLevelLabel } from "../matchLabels";
import { SF_ADVANCEMENT, SF_ROUNDS, isDoubleElimFormat } from "../playoffBracket";

function TeamList({ teams }: { teams: { number: string; name: string }[] }) {
  if (teams.length === 0) {
    return <span className="bracket-tbd">TBD</span>;
  }
  return (
    <>
      {teams.map((t) => (
        <span key={t.number} className="bracket-team">
          {t.number}
        </span>
      ))}
    </>
  );
}

function BracketMatchCard({ match, advancement }: { match: MatchInfo; advancement?: { winnerTo?: string; loserTo?: string } }) {
  return (
    <div className={`bracket-card ${match.played ? "played" : ""}`}>
      <div className="bracket-card-label">
        Match {match.matchNumber}
        {match.played && match.winner && (
          <span className={`badge ${match.winner === "red" ? "program" : "preview"}`} style={{ marginLeft: 6 }}>
            {match.winner.toUpperCase()}
          </span>
        )}
      </div>
      <div className="bracket-card-alliance red">
        <TeamList teams={match.red} />
      </div>
      <div className="bracket-card-alliance blue">
        <TeamList teams={match.blue} />
      </div>
      {advancement && (
        <div className="bracket-flavor">
          {advancement.winnerTo && <div>Winner → {advancement.winnerTo}</div>}
          {advancement.loserTo && <div>Loser → {advancement.loserTo}</div>}
        </div>
      )}
    </div>
  );
}

export function PlayoffBracket({ matches }: { matches: MatchInfo[] }) {
  const sfMatches = matches.filter((m) => m.compLevel === "sf");
  const fMatches = matches.filter((m) => m.compLevel === "f").sort((a, b) => a.matchNumber - b.matchNumber);
  const qfMatches = matches.filter((m) => m.compLevel === "qf");

  if (sfMatches.length === 0 && fMatches.length === 0 && qfMatches.length === 0) {
    return <div className="empty-state">Bracket isn't available yet — it'll populate once playoffs are seeded at this event.</div>;
  }

  const sfNumbers = sfMatches.map((m) => m.matchNumber);
  const doubleElim = isDoubleElimFormat(sfNumbers);

  if (!doubleElim) {
    // Older-format event (or a small/non-standard bracket) — show matches plainly
    // rather than guessing at an advancement structure we can't verify.
    const all = [...qfMatches, ...sfMatches, ...fMatches].sort(
      (a, b) => a.compLevel.localeCompare(b.compLevel) || a.setNumber - b.setNumber || a.matchNumber - b.matchNumber
    );
    return (
      <div>
        <p className="small-note" style={{ marginBottom: 10 }}>
          This event's bracket doesn't match the standard 8-alliance double-elimination format, so advancement labels aren't shown — just the matches themselves.
        </p>
        <div className="bracket-fallback-list">
          {all.map((m) => (
            <div key={m.key} className="bracket-card">
              <div className="bracket-card-label">
                {compLevelLabel(m.compLevel)} #{m.matchNumber}
                {m.played && m.winner && (
                  <span className={`badge ${m.winner === "red" ? "program" : "preview"}`} style={{ marginLeft: 6 }}>
                    {m.winner.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="bracket-card-alliance red"><TeamList teams={m.red} /></div>
              <div className="bracket-card-alliance blue"><TeamList teams={m.blue} /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sfByNumber = new Map(sfMatches.map((m) => [m.matchNumber, m]));

  return (
    <div>
      <div className="bracket-rounds">
        {SF_ROUNDS.map((round) => (
          <div className="bracket-round" key={round.title}>
            <div className="bracket-round-title">{round.title}</div>
            {round.matchNumbers.map((num) => {
              const match = sfByNumber.get(num);
              if (!match) return null;
              return <BracketMatchCard key={num} match={match} advancement={SF_ADVANCEMENT[num]} />;
            })}
          </div>
        ))}

        {fMatches.length > 0 && (
          <div className="bracket-round">
            <div className="bracket-round-title">Finals</div>
            {fMatches.map((m) => (
              <BracketMatchCard key={m.key} match={m} />
            ))}
            <div className="bracket-flavor">First alliance to 2 wins is Event Champion.</div>
          </div>
        )}
      </div>
    </div>
  );
}
