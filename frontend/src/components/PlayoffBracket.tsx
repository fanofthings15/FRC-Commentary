import React, { useLayoutEffect, useRef, useState } from "react";
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

function BracketMatchCard({
  refCb,
  match,
  advancement,
  isCurrent,
}: {
  refCb: (el: HTMLDivElement | null) => void;
  match: MatchInfo;
  advancement?: { winnerTo?: string; loserTo?: string };
  isCurrent?: boolean;
}) {
  return (
    <div className={`bracket-card ${match.played ? "played" : ""} ${isCurrent ? "current" : ""}`} ref={refCb}>
      {isCurrent && <div className="bracket-here-tag">YOU ARE HERE</div>}
      <div className="bracket-card-label">
        Match {match.matchNumber}
        {match.played && match.winner && (
          <span className={`badge ${match.winner === "red" ? "red" : "blue"}`} style={{ marginLeft: 6 }}>
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

interface LineSeg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: "win" | "loss";
}

export function PlayoffBracket({ matches, currentMatchKey }: { matches: MatchInfo[]; currentMatchKey?: string }) {
  const sfMatches = matches.filter((m) => m.compLevel === "sf");
  const fMatches = matches.filter((m) => m.compLevel === "f").sort((a, b) => a.matchNumber - b.matchNumber);
  const qfMatches = matches.filter((m) => m.compLevel === "qf");

  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const currentCardRef = useRef<HTMLDivElement | null>(null);
  const [lines, setLines] = useState<LineSeg[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  const sfNumbers = sfMatches.map((m) => m.matchNumber);
  const doubleElim = isDoubleElimFormat(sfNumbers);

  useLayoutEffect(() => {
    if (!doubleElim) return;

    function targetKey(label?: string): string | null {
      if (!label) return null;
      const m = label.match(/Match (\d+)/);
      if (m) return `sf-${m[1]}`;
      if (label === "Finals" && fMatches.length > 0) return "f-0";
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
          This event's bracket doesn't match the standard 8-alliance double-elimination format, so advancement labels aren't shown — just the matches themselves.
        </p>
        <div className="bracket-fallback-list">
          {all.map((m) => {
            const isCurrent = m.key === currentMatchKey;
            return (
              <div
                key={m.key}
                className={`bracket-card ${isCurrent ? "current" : ""}`}
                ref={isCurrent ? currentCardRef : undefined}
              >
                {isCurrent && <div className="bracket-here-tag">YOU ARE HERE</div>}
                <div className="bracket-card-label">
                  {compLevelLabel(m.compLevel)} #{m.matchNumber}
                  {m.played && m.winner && (
                    <span className={`badge ${m.winner === "red" ? "red" : "blue"}`} style={{ marginLeft: 6 }}>
                      {m.winner.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="bracket-card-alliance red"><TeamList teams={m.red} /></div>
                <div className="bracket-card-alliance blue"><TeamList teams={m.blue} /></div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const sfByNumber = new Map(sfMatches.map((m) => [m.matchNumber, m]));

  return (
    <div className="bracket-scroll" ref={scrollRef}>
      <div className="bracket-inner" ref={innerRef}>
        <svg
          className="bracket-lines-svg"
          width={svgSize.width}
          height={svgSize.height}
        >
          {lines.map((l, i) => {
            const midX = (l.x1 + l.x2) / 2;
            return (
              <path
                key={i}
                d={`M ${l.x1} ${l.y1} C ${midX} ${l.y1}, ${midX} ${l.y2}, ${l.x2} ${l.y2}`}
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
                  <BracketMatchCard
                    key={num}
                    match={match}
                    advancement={SF_ADVANCEMENT[num]}
                    isCurrent={isCurrent}
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
            <div className="bracket-round">
              <div className="bracket-round-title">Finals</div>
              {fMatches.map((m, idx) => {
                const isCurrent = m.key === currentMatchKey;
                return (
                  <BracketMatchCard
                    key={m.key}
                    match={m}
                    isCurrent={isCurrent}
                    refCb={(el) => {
                      cardRefs.current[`f-${idx}`] = el;
                      if (isCurrent) currentCardRef.current = el;
                    }}
                  />
                );
              })}
              <div className="bracket-flavor">First alliance to 2 wins is Event Champion.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
