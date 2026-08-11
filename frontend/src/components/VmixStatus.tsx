import React, { useEffect, useState, useCallback } from "react";
import { Settings, VmixStatus as VmixStatusType } from "../types";

// Read-only status display. Cutting/switching is handled directly in vMix by
// whoever's running the board — this panel is just so the rest of the team
// can see what's on program/preview without needing their own vMix window open.
export function VmixStatus({ settings }: { settings: Settings }) {
  const [status, setStatus] = useState<VmixStatusType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!settings.vmixHost || !settings.backendUrl) return;
    try {
      const url = new URL(`${settings.backendUrl}/api/vmix/status`);
      url.searchParams.set("host", settings.vmixHost);
      url.searchParams.set("port", settings.vmixPort || "8088");
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reach vMix");
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [settings.vmixHost, settings.vmixPort, settings.backendUrl]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  if (!settings.vmixHost) {
    return <div className="empty-state">Add your vMix host IP in Settings to see live status.</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <span className={`status-dot ${error ? "bad" : "ok"}`} />
        <span className="small-note">{error ? error : `Connected to ${settings.vmixHost}:${settings.vmixPort}`}</span>
      </div>

      {status && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <span className="small-note">
              {status.recording ? "● Recording" : "Not recording"}
              {status.streaming ? " · ● Streaming" : ""}
            </span>
          </div>

          <div className="vmix-inputs">
            {status.inputs.map((input) => {
              const isProgram = input.number === status.active;
              const isPreview = input.number === status.preview;
              return (
                <div
                  key={input.number}
                  className={`vmix-input-row ${isProgram ? "program" : ""} ${isPreview ? "preview" : ""}`}
                >
                  <span>
                    <strong>{input.number}</strong> — {input.title}
                  </span>
                  <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {isProgram && <span className="badge program">PGM</span>}
                    {isPreview && <span className="badge preview">PVW</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
