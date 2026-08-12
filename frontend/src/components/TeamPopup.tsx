import React, { useEffect, useMemo, useState } from "react";
import { Settings, TeamRecentInfo } from "../types";
import { useOprs } from "../hooks/useOprs";

export function TeamPopup({
  teamNumber,
  settings,
  onClose,
}: {
  teamNumber: string;
  settings: Settings;
  onClose: () => void;
}) {
  const [data, setData] = useState<TeamRecentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!settings.tbaApiKey) {
      setError("Add your TBA API key in Settings to look up team info.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    const params = new URLSearchParams({ teamNumber, apiKey: settings.tbaApiKey });
    fetch(`/api/tba/team-recent?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load team info.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamNumber, settings.tbaApiKey]);

  const { oprs } = useOprs(settings);
  const teamOpr = useMemo(() => oprs.find((o) => o.teamNumber === teamNumber)?.opr ?? null, [oprs, teamNumber]);

  const mostRecent = data?.events[0];
  const otherEvents = data?.events.slice(1, 4); // a few more for season context, not the whole history

  return (
    <div className="team-popup-overlay" onClick={onClose}>
      <div className="team-popup" onClick={(e) => e.stopPropagation()}>
        <div className="team-popup-header">
          <span className="team-popup-number">{teamNumber}</span>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        {loading && <div className="empty-state">Loading…</div>}
        {error && <div className="error-text">{error}</div>}

        {data && (
          <>
            <div className="team-popup-name">{data.team.name}</div>
            {data.team.hometown && <div className="small-note">{data.team.hometown}</div>}
            {data.team.rookieYear && <div className="small-note">Rookie year {data.team.rookieYear}</div>}
            {teamOpr !== null && settings.tbaEventKey && (
              <div className="team-popup-opr">
                OPR at {settings.tbaEventKey}: <strong>{teamOpr.toFixed(1)}</strong>
              </div>
            )}

            <div className="team-popup-section-title">Most recent event ({data.season})</div>
            {mostRecent ? (
              <div className="team-popup-event">
                <div className="team-popup-event-name">
                  {mostRecent.eventName}
                  {mostRecent.award && (
                    <span className={`team-popup-award-tag ${mostRecent.award === "Winner" ? "winner" : "finalist"}`}>
                      {mostRecent.award === "Winner" ? "🏆 WINNER" : "FINALIST"}
                    </span>
                  )}
                </div>
                {mostRecent.rank ? (
                  <div className="team-popup-event-rank">
                    Rank #{mostRecent.rank}
                    {mostRecent.wins !== null && (
                      <span className="small-note" style={{ marginLeft: 6 }}>
                        {mostRecent.wins}-{mostRecent.losses}-{mostRecent.ties}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="small-note">No ranking data published for this event yet.</span>
                )}
              </div>
            ) : (
              <div className="small-note">No events found for {data.season} yet.</div>
            )}

            {otherEvents && otherEvents.length > 0 && (
              <>
                <div className="team-popup-section-title">Earlier this season</div>
                <div className="team-popup-other-events">
                  {otherEvents.map((e) => (
                    <div key={e.eventKey} className="team-popup-other-event">
                      <span>
                        {e.eventName}
                        {e.award && (
                          <span className={`team-popup-award-tag small ${e.award === "Winner" ? "winner" : "finalist"}`}>
                            {e.award === "Winner" ? "🏆" : "F"}
                          </span>
                        )}
                      </span>
                      <span className="small-note">{e.rank ? `#${e.rank}` : "—"}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
