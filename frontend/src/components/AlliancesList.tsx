import React from "react";
import { Settings } from "../types";
import { useAlliances } from "../hooks/useAlliances";

export function AlliancesList({ settings }: { settings: Settings }) {
  const { alliances, error, loading, reload } = useAlliances(settings);

  if (!settings.tbaApiKey || !settings.tbaEventKey) {
    return <div className="empty-state">Add your TBA API key and event key in Settings to load alliances.</div>;
  }

  if (loading && alliances.length === 0) {
    return <div className="empty-state">Loading alliances…</div>;
  }

  if (error && alliances.length === 0) {
    return <div className="error-text">{error}</div>;
  }

  if (alliances.length === 0) {
    return <div className="empty-state">Alliances haven't been selected yet for this event — this fills in right after alliance selection.</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="small-note">{loading ? "Refreshing…" : `${alliances.length} alliances`}</span>
        <button className="btn" onClick={reload}>Refresh</button>
      </div>

      <div className="alliances-grid">
        {alliances.map((a) => (
          <div key={a.number} className="alliance-card">
            <div className="alliance-card-title">{a.name}</div>
            {a.teams.map((t, i) => (
              <div key={t.number} className="alliance-card-team">
                <span className="num">{t.number}</span>
                <span className="name">{t.name}</span>
                {i === 0 && <span className="alliance-captain-tag">CAPTAIN</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
