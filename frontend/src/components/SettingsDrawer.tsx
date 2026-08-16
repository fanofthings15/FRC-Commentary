import React, { useRef, useState } from "react";
import { Settings } from "../types";
import { settingsToJson, parseImportedSettings } from "../settingsPortability";
import { useAppVersion } from "../hooks/useAppVersion";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const appVersion = useAppVersion();

  function handleExport() {
    const blob = new Blob([settingsToJson(settings)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "frc-commentary-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = parseImportedSettings(String(reader.result));
      if ("error" in result) {
        setImportMessage({ text: result.error, isError: true });
      } else {
        onChange(result.settings);
        setImportMessage({ text: "Settings imported.", isError: false });
      }
    };
    reader.onerror = () => setImportMessage({ text: "Couldn't read that file.", isError: true });
    reader.readAsText(file);
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-drawer" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <p className="small-note" style={{ marginBottom: 18 }}>
          Stored encrypted on the backend, shared across devices pointed at it.
        </p>

        <Field
          label="YouTube Video ID"
          hint="The v= part of your live stream URL"
          value={settings.youtubeVideoId}
          onChange={(v) => onChange({ youtubeVideoId: v })}
          placeholder="dQw4w9WgXcQ"
        />

        <Field
          label="YouTube API Key"
          hint="Google Cloud → YouTube Data API v3 key. Powers the live viewer + watch-hour stats."
          value={settings.youtubeApiKey}
          onChange={(v) => onChange({ youtubeApiKey: v })}
          placeholder="AIza…"
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
          label="Telestrator URL (optional)"
          hint="Leave blank to auto-use http://<vMix host>:<port>/telestrator/"
          value={settings.telestratorUrl}
          onChange={(v) => onChange({ telestratorUrl: v })}
          placeholder="http://192.168.25.22:8088/telestrator/"
        />

        <div className="field">
          <label>Backup / Restore</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" style={{ flex: 1 }} onClick={handleExport}>Export to file</button>
            <button className="btn" style={{ flex: 1 }} onClick={handleImportClick}>Import from file</button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={handleFileSelected}
          />
          <div className="hint">
            The exported file includes your TBA API key in plain text — store it somewhere private.
          </div>
          {importMessage && (
            <div className={importMessage.isError ? "error-text" : "small-note"} style={{ marginTop: 6 }}>
              {importMessage.text}
            </div>
          )}
        </div>

        <button className="btn primary" onClick={onClose} style={{ width: "100%", marginTop: 8 }}>
          Done
        </button>

        {appVersion && (
          <div className="small-note" style={{ textAlign: "center", marginTop: 12 }}>
            FRC Commentary Dashboard v{appVersion}
          </div>
        )}
      </div>
    </div>
  );
}
