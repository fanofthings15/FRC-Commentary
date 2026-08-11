import React, { useEffect, useState, useCallback } from "react";
import { Settings, VmixStatus as VmixStatusType } from "../types";

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

  const sendCommand = useCallback(
    async (fn: string, input?: string) => {
      const url = new URL(`${settings.backendUrl}/api/vmix/command`);
      url.searchParams.set("host", settings.vmixHost);
      url.searchParams.set("port", settings.vmixPort || "8088");
      url.searchParams.set("function", fn);
      if (input) url.searchParams.set("input", input);
      await fetch(url.toString(), { method: "POST" });
      load();
    },
    [settings.vmixHost, settings.vmixPort, settings.backendUrl, load]
  );

  if (!settings.vmixHost) {
    return <div className="empty-state">Add your vMix host IP in Settings to see live status and controls.</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <span className={`status-dot ${error ? "bad" : "ok"}`} />
        <span className="small-note">{error ? error : `Connected to ${settings.vmixHost}:${settings.vmixPort}`}</span>
      </div>

      {status && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button className="btn danger" onClick={() => sendCommand("Cut")}>Cut</button>
            <button className="btn" onClick={() => sendCommand("Fade", "500")}>Fade</button>
            <button className="btn" onClick={() => sendCommand("StartRecording")}>Start Rec</button>
            <button className="btn" onClick={() => sendCommand("StopRecording")}>Stop Rec</button>
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
                    <button className="btn" onClick={() => sendCommand("PreviewInput", input.number)}>PVW</button>
                    <button className="btn" onClick={() => sendCommand("CutDirect", input.number)}>Cut To</button>
                  </span>
                </div>
              );
            })}
          </div>
          <p className="small-note" style={{ marginTop: 10 }}>
            Telestrator and replay inputs (if named as such in vMix) appear in this list like any other source —
            preview or cut to them the same way.
          </p>
        </>
      )}
    </div>
  );
}
