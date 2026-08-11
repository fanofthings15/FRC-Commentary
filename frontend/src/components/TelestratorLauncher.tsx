import React from "react";
import { Settings, resolveTelestratorUrl } from "../types";

export function TelestratorLauncher({ settings }: { settings: Settings }) {
  const url = resolveTelestratorUrl(settings);

  const openWindow = () => {
    if (!url) return;
    window.open(url, "telestrator", "width=1280,height=770,noopener,noreferrer");
  };

  if (!url) {
    return (
      <div className="telestrator-launcher">
        <span className="small-note">Add your vMix host in Settings to enable the telestrator launcher.</span>
      </div>
    );
  }

  return (
    <div className="telestrator-launcher">
      <button className="btn primary" onClick={openWindow}>Open Telestrator</button>
      <span className="small-note">
        Opens in its own window, sized correctly — drag it to a second monitor if you have one.
      </span>
    </div>
  );
}
