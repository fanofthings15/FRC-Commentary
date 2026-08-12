import React, { useState } from "react";
import { Settings } from "../types";

export function EventQuickSwitch({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (partial: Partial<Settings>) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!settings.tbaEventKey && settings.recentEventKeys.length === 0) {
    return null;
  }

  return (
    <div className="event-switch">
      <button className="event-switch-current" onClick={() => setOpen((o) => !o)}>
        {settings.tbaEventKey || "No event set"} <span className="event-switch-caret">▾</span>
      </button>
      {open && (
        <div className="event-switch-menu">
          {settings.recentEventKeys.length === 0 ? (
            <div className="event-switch-empty small-note">No other recent events</div>
          ) : (
            settings.recentEventKeys.map((key) => (
              <button
                key={key}
                className="event-switch-item"
                onClick={() => {
                  onChange({ tbaEventKey: key });
                  setOpen(false);
                }}
              >
                {key}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
