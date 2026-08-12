import React, { useLayoutEffect, useRef, useState } from "react";
import { MatchInfo } from "../types";
import { compLevelLabel, matchDisplayNumber } from "../matchLabels";
import { SF_ADVANCEMENT, SF_ROUNDS, isDoubleElimFormat } from "../playoffBracket";

function teamLabel(
  teams: { number: string; name: string }[],
  allianceByTeam: Map<string, number>
): { allianceTag: string | null; teamsText: string } {
  if (teams.length === 0) return { allianceTag: null, teamsText: "TBD" };
  const allianceNum = allianceByTeam.get(teams[0].number);
  return {
    allianceTag: allianceNum ? `A${allianceNum}` : null,
    teamsText: teams.map((t) => t.number).join(", "),
  };
}

// Compact TBA-style node: a small header plus two stacked rows (red / blue),
// each showing an alliance seed tag, teams, and a score once played.
// By default the score is a binary win/loss ("1"/"0"), which is correct for
// single-elimination SF matches. Finals is a best-of-3 series, so it passes
// explicit redScoreText/blueScoreText (the running game count) instead.
function BracketNode({
  refCb,
  title,
  red,
  blue,
  redWon,
  blueWon,
  played,
  isCurrent,
  advancement,
  redScoreText,
  blueScoreText,
}: {
  refCb: (el: HTMLDivElement | null) => void;
  title: string;
  red: { allianceTag: string | null; teamsText: string };
  blue: { allianceTag: string | null; teamsText: string };
  redWon: boolean;
  blueWon: boolean;
  played: boolean;
  isCurrent?: boolean;
  advancement?: { winnerTo?: string; loserTo?: string };
  redScoreText?: string;
  blueScoreText?: string;
}) {
  return (
    <div className={`bracket-node ${isCurrent ? "current" : ""}`} ref={refCb}>
      {isCurrent && <div className="bracket-here-tag">YOU ARE HERE</div>}
      <div className="bracket-node-title">{title}</div>
      <div className={`bracket-node-row red ${played && redWon ? "won" : ""}`}>
        <span className="bracket-node-left">
          {red.allianceTag && <span className="bracket-alliance-tag">{red.allianceTag}</span>}
          <span className="bracket-node-teams">{red.teamsText}</span>
        </span>
        {played && <span className="bracket-node-score">{redScoreText ?? (redWon ? "1" : "0")}</span>}
      </div>
      <div className={`bracket-node-row blue ${played && blueWon ? "won" : ""}`}>
        <span className="bracket-node-left">
          {blue.allianceTag && <span className="bracket-alliance-tag">{blue.allianceTag}</span>}
          <span className="bracket-node-teams">{blue.teamsText}</span>
        </span>
        {played && <span className="bracket-node-score">{blueScoreText ?? (blueWon ? "1" : "0")}</span>}
      </div>
      {advancement && (advancement.winnerTo || advancement.loserTo) && (
        <div className="bracket-node-advancement">
          {advancement.winnerTo && <div>W → {advancement.winnerTo}</div>}
          {advancement.loserTo && <div>L → {advancement.loserTo}</div>}
        </div>
      )}
    </div>
  );
}

interface LineSeg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: "win" | "loss";
}

export function PlayoffBracket({
  matches,
  currentMatchKey,
  allianceByTeam,
}: {
  matches: MatchInfo[];
  currentMatchKey?: string;
  allianceByTeam: Map<string, number>;
}) {
  const sfMatches = matches.filter((m) => m.compLevel === "sf");
  const fMatches = matches.filter((m) => m.compLevel === "f").sort((a, b) => a.matchNumber - b.matchNumber);
  const qfMatches = matches.filter((m) => m.compLevel === "qf");

  const innerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const currentCardRef = useRef<HTMLDivElement | null>(null);
  const [lines, setLines] = useState<LineSeg[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  const sfNumbers = sfMatches.map((m) => m.setNumber);
  const doubleElim = isDoubleElimFormat(sfNumbers);

  // Which match feeds into which — mirrors the standard bracket already
  // encoded in playoffBracket.ts (both winner and loser advancement paths).
  useLayoutEffect(() => {
    if (!doubleElim) return;

    function targetKey(label?: string): string | null {
      if (!label) return null;
      const m = label.match(/Match (\d+)/);
      if (m) return `sf-${m[1]}`;
      if (label === "Finals" && fMatches.length > 0) return "final";
      return null;
    }

    function compute() {
      const inner = innerRef.current;
      if (!inner) return;
      const innerRect = inner.getBoundingClientRect();
      const segs: LineSeg[] = [];

      for (const [numStr, info] of Object.entries(SF_ADVANCEMENT)) {
        const sourceEl = cardRefs.current[`sf-${numStr}`];
        if (!sourceEl) continue;
        const sRect = sourceEl.getBoundingClientRect();
        const sx = sRect.right - innerRect.left;
        const sy = sRect.top + sRect.height / 2 - innerRect.top;

        const winnerKey = targetKey(info.winnerTo);
        if (winnerKey && cardRefs.current[winnerKey]) {
          const tRect = cardRefs.current[winnerKey]!.getBoundingClientRect();
          segs.push({
            x1: sx,
            y1: sy,
            x2: tRect.left - innerRect.left,
            y2: tRect.top + tRect.height / 2 - innerRect.top,
            kind: "win",
          });
        }

        const loserKey = targetKey(info.loserTo);
        if (loserKey && cardRefs.current[loserKey]) {
          const tRect = cardRefs.current[loserKey]!.getBoundingClientRect();
          segs.push({
            x1: sx,
            y1: sy,
            x2: tRect.left - innerRect.left,
            y2: tRect.top + tRect.height / 2 - innerRect.top,
            kind: "loss",
          });
        }
      }

      setLines(segs);
      setSvgSize({ width: inner.scrollWidth, height: inner.scrollHeight });
    }

    compute();
    const observer = new ResizeObserver(compute);
    if (innerRef.current) observer.observe(innerRef.current);
    window.addEventListener("resize", compute);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [doubleElim, matches, fMatches.length]);

  useLayoutEffect(() => {
    if (currentCardRef.current) {
      currentCardRef.current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [currentMatchKey]);

  if (sfMatches.length === 0 && fMatches.length === 0 && qfMatches.length === 0) {
    return <div className="empty-state">Bracket isn't available yet — it'll populate once playoffs are seeded at this event.</div>;
  }

  if (!doubleElim) {
    const all = [...qfMatches, ...sfMatches, ...fMatches].sort(
      (a, b) => a.compLevel.localeCompare(b.compLevel) || a.setNumber - b.setNumber || a.matchNumber - b.matchNumber
    );
    return (
      <div>
        <p className="small-note" style={{ marginBottom: 10 }}>
          This event's bracket doesn't match the standard 8-alliance double-elimination format, so the bracket view isn't shown — just the matches themselves.
        </p>
        <div className="bracket-fallback-list">
          {all.map((m) => {
            const isCurrent = m.key === currentMatchKey;
            const red = teamLabel(m.red, allianceByTeam);
            const blue = teamLabel(m.blue, allianceByTeam);
            return (
              <div
                key={m.key}
                className={`bracket-card ${isCurrent ? "current" : ""}`}
                ref={isCurrent ? currentCardRef : undefined}
              >
                {isCurrent && <div className="bracket-here-tag">YOU ARE HERE</div>}
                <div className="bracket-card-label">
                  {compLevelLabel(m.compLevel)} #{matchDisplayNumber(m)}
                  {m.played && m.winner && (
                    <span className={`badge ${m.winner === "red" ? "red" : "blue"}`} style={{ marginLeft: 6 }}>
                      {m.winner.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="bracket-card-alliance red">
                  {red.allianceTag && <span className="bracket-alliance-tag">{red.allianceTag}</span>} {red.teamsText}
                </div>
                <div className="bracket-card-alliance blue">
                  {blue.allianceTag && <span className="bracket-alliance-tag">{blue.allianceTag}</span>} {blue.teamsText}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const sfByNumber = new Map(sfMatches.map((m) => [m.setNumber, m]));

  // Merge all Finals games into a single result node, TBA-style, rather than
  // showing F1/F2/F3 as separate boxes — the team lineup doesn't change
  // between them, only the running win tally does.
  const redFinalsWins = fMatches.filter((m) => m.winner === "red").length;
  const blueFinalsWins = fMatches.filter((m) => m.winner === "blue").length;
  const finalsPlayed = fMatches.some((m) => m.played);
  const finalsTeams = fMatches[0];
  const isChampionshipDecided = redFinalsWins >= 2 || blueFinalsWins >= 2;
  const isCurrentFinals = fMatches.some((m) => m.key === currentMatchKey);

  return (
    <div className="bracket-scroll">
      <div className="bracket-inner" ref={innerRef}>
        <svg className="bracket-lines-svg" width={svgSize.width} height={svgSize.height}>
          {lines.map((l, i) => {
            // Stagger the turn point between two "lanes" instead of always
            // using the exact midpoint — when several lines share a round
            // gap (e.g. multiple losers converging on the same match), a
            // single shared turn-x bunches all their vertical segments
            // together and makes them hard to tell apart. Alternating lanes
            // spreads them out.
            const lane = i % 2 === 0 ? 0.38 : 0.62;
            const turnX = l.x1 + (l.x2 - l.x1) * lane;
            return (
              <path
                key={i}
                d={`M ${l.x1} ${l.y1} H ${turnX} V ${l.y2} H ${l.x2}`}
                className={l.kind === "win" ? "bracket-line-win" : "bracket-line-loss"}
              />
            );
          })}
        </svg>

        <div className="bracket-rounds">
          {SF_ROUNDS.map((round) => (
            <div className="bracket-round" key={round.title}>
              <div className="bracket-round-title">{round.title}</div>
              {round.matchNumbers.map((num) => {
                const match = sfByNumber.get(num);
                if (!match) return null;
                const isCurrent = match.key === currentMatchKey;
                return (
                  <BracketNode
                    key={num}
                    title={`Match ${num}`}
                    red={teamLabel(match.red, allianceByTeam)}
                    blue={teamLabel(match.blue, allianceByTeam)}
                    redWon={match.winner === "red"}
                    blueWon={match.winner === "blue"}
                    played={match.played}
                    isCurrent={isCurrent}
                    advancement={SF_ADVANCEMENT[num]}
                    refCb={(el) => {
                      cardRefs.current[`sf-${num}`] = el;
                      if (isCurrent) currentCardRef.current = el;
                    }}
                  />
                );
              })}
            </div>
          ))}

          {fMatches.length > 0 && (
            <div className="bracket-round bracket-round-final">
              <div className="bracket-round-title">Finals</div>
              <BracketNode
                title={isChampionshipDecided ? "Event Champion" : "Finals"}
                red={finalsTeams ? teamLabel(finalsTeams.red, allianceByTeam) : { allianceTag: null, teamsText: "TBD" }}
                blue={finalsTeams ? teamLabel(finalsTeams.blue, allianceByTeam) : { allianceTag: null, teamsText: "TBD" }}
                redWon={redFinalsWins > blueFinalsWins}
                blueWon={blueFinalsWins > redFinalsWins}
                played={finalsPlayed}
                redScoreText={finalsPlayed ? String(redFinalsWins) : undefined}
                blueScoreText={finalsPlayed ? String(blueFinalsWins) : undefined}
                isCurrent={isCurrentFinals}
                refCb={(el) => {
                  cardRefs.current["final"] = el;
                  if (isCurrentFinals) currentCardRef.current = el;
                }}
              />
              {finalsPlayed && (
                <div className="bracket-flavor" style={{ marginTop: 8 }}>
                  {redFinalsWins} - {blueFinalsWins} · first to 2 wins is Event Champion
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
