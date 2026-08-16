import React, { useState } from "react";
import { useYouTubeStats } from "../hooks/useYouTubeStats";

function formatWatchHours(hours: number): string {
  if (hours < 10) return hours.toFixed(1);
  return Math.round(hours).toLocaleString();
}

function formatCount(n: number): string {
  return n.toLocaleString();
}

// Inline "type the correct total, we'll store the offset needed to hit it"
// editor. Only shown in the full (non-compact) panel - the commentator
// status bar is not the place to be fixing numbers mid-broadcast.
function WatchHoursEditor({
  currentHours,
  onSave,
  onCancel,
}: {
  currentHours: number;
  onSave: (hours: number) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(currentHours.toFixed(1));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a non-negative number.");
      return;
    }
    setSaving(true);
    const err = await onSave(parsed);
    setSaving(false);
    if (err) setError(err);
    else onCancel();
  }

  return (
    <div className="stream-stat-offset-editor" onClick={(e) => e.stopPropagation()}>
      <input
        type="number"
        min="0"
        step="0.1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
      <button className="btn primary" onClick={handleSave} disabled={saving}>
        Save
      </button>
      <button className="btn" onClick={onCancel} disabled={saving}>
        Cancel
      </button>
      {error && <div className="error-text small-note">{error}</div>}
    </div>
  );
}

// Live YouTube stream stats for the hosts: how many are watching right now,
// running watch hours, and total views. `compact` gives a slim inline row for
// the commentator status bar; the default is a panel-sized readout.
export function StreamStats({ compact = false }: { compact?: boolean }) {
  const { stats, setWatchHours } = useYouTubeStats();
  const [editingHours, setEditingHours] = useState(false);

  if (!stats || !stats.configured) {
    if (compact) return null;
    return (
      <div className="empty-state">
        Add your YouTube Video ID and API key in Settings to show viewer stats.
      </div>
    );
  }

  const viewers = stats.concurrentViewers;

  return (
    <div className={compact ? "stream-stats compact" : "stream-stats"}>
      <div className="stream-stat">
        <div className="stream-stat-value">
          {stats.isLive && viewers != null ? formatCount(viewers) : "—"}
        </div>
        <div className="stream-stat-label">
          <span className={`status-dot ${stats.isLive ? "ok" : "warn"}`} />
          {stats.isLive ? "Watching now" : "Not live"}
        </div>
      </div>

      <div className="stream-stat">
        {!compact && editingHours ? (
          <WatchHoursEditor
            currentHours={stats.watchHours}
            onSave={setWatchHours}
            onCancel={() => setEditingHours(false)}
          />
        ) : (
          <>
            <div className="stream-stat-value">{formatWatchHours(stats.watchHours)}</div>
            <div className="stream-stat-label">
              Watch hours
              {!compact && (
                <button
                  type="button"
                  className="stream-stat-edit-btn"
                  onClick={() => setEditingHours(true)}
                  title="Fix this number if it's drifted out of sync"
                >
                  ✎
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="stream-stat">
        <div className="stream-stat-value">
          {stats.viewCount != null ? formatCount(stats.viewCount) : "—"}
        </div>
        <div className="stream-stat-label">Total views</div>
      </div>

      {stats.error && !compact && (
        <div className="small-note error-text" style={{ flexBasis: "100%", marginTop: 4 }}>
          {stats.error}
        </div>
      )}
    </div>
  );
}
