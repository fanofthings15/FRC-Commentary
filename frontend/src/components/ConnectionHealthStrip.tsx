import React from "react";
import { Settings } from "../types";
import { HealthStatus, useConnectionHealth } from "../hooks/useConnectionHealth";

function dotClass(status: HealthStatus): string {
  if (status === "ok") return "ok";
  if (status === "bad") return "bad";
  return "warn"; // "unset" or "checking"
}

function labelSuffix(status: HealthStatus): string {
  if (status === "unset") return " (not set)";
  if (status === "checking") return " (checking…)";
  return "";
}

export function ConnectionHealthStrip({ settings }: { settings: Settings }) {
  const { backend, tba, vmix } = useConnectionHealth(settings);

  return (
    <div className="health-strip">
      <span>
        <span className={`status-dot ${dotClass(backend)}`} />
        Backend{labelSuffix(backend)}
      </span>
      <span>
        <span className={`status-dot ${dotClass(tba)}`} />
        TBA{labelSuffix(tba)}
      </span>
      <span>
        <span className={`status-dot ${dotClass(vmix)}`} />
        vMix{labelSuffix(vmix)}
      </span>
    </div>
  );
}
