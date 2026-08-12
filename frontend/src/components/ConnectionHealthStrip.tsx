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
  const { backend, tba, vmix, alerts } = useConnectionHealth(settings);

  const items: { key: string; label: string; status: HealthStatus }[] = [
    { key: "backend", label: "Backend", status: backend },
    { key: "tba", label: "TBA", status: tba },
    { key: "vmix", label: "vMix", status: vmix },
    { key: "alerts", label: "Alerts", status: alerts },
  ];

  return (
    <div className="health-strip">
      {items.map((item) => (
        <span key={item.key} title={`${item.label}${labelSuffix(item.status)}`}>
          <span className={`status-dot ${dotClass(item.status)}`} />
          <span className="health-strip-label">
            {item.label}
            {labelSuffix(item.status)}
          </span>
        </span>
      ))}
    </div>
  );
}
