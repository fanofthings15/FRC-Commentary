import React from "react";
import { Settings } from "../types";

interface Props {
  settings: Settings;
  onChange: (partial: Partial<Settings>) => void;
  onClose: () => void;
}

function Field({
  label, hint, value, onChange, placeholder,
}: {
  label: string; hint: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <div className="hint">{hint}</div>
    </div>
  );
}

export function SettingsDrawer({ settings, onChange, onClose }: Props) {
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-drawer" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <p className="small-note" style={{ marginBottom: 18 }}>
          Saved to this browser only. Nothing here is stored in the codebase.
        </p>

        <Field
          label="YouTube Video ID"
          hint="The v= part of your live stream URL"
          value={settings.youtubeVideoId}
          onChange={(v) => onChange({ youtubeVideoId: v })}
          placeholder="dQw4w9WgXcQ"
        />

        <Field
          label="TBA API Key"
          hint="thebluealliance.com/account → API Keys → Read API Key"
          value={settings.tbaApiKey}
          onChange={(v) => onChange({ tbaApiKey: v })}
          placeholder="paste key"
        />

        <Field
          label="TBA Event Key"
          hint="e.g. 2026miket"
          value={settings.tbaEventKey}
          onChange={(v) => onChange({ tbaEventKey: v })}
          placeholder="2026miket"
        />

        <Field
          label="vMix Host"
          hint="IP of the vMix PC on the local network"
          value={settings.vmixHost}
          onChange={(v) => onChange({ vmixHost: v })}
          placeholder="192.168.1.50"
        />

        <Field
          label="vMix Port"
          hint="Default vMix web controller port"
          value={settings.vmixPort}
          onChange={(v) => onChange({ vmixPort: v })}
          placeholder="8088"
        />

        <Field
          label="Backend URL"
          hint="Where this app's backend server is running"
          value={settings.backendUrl}
          onChange={(v) => onChange({ backendUrl: v })}
          placeholder="http://localhost:4000"
        />

        <button className="btn primary" onClick={onClose} style={{ width: "100%", marginTop: 8 }}>
          Done
        </button>
      </div>
    </div>
  );
}
