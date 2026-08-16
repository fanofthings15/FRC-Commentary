import { useEffect, useState } from "react";

const STORAGE_KEY = "frc-commentary:bigUi";

// Deliberately local to this browser/window rather than routed through
// useSettings — it's a display preference for whatever screen this tab is
// docked on, not something that should push onto every other device sharing
// the backend settings.
export function useBigUi() {
  const [bigUi, setBigUi] = useState<boolean>(() => localStorage.getItem(STORAGE_KEY) === "1");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, bigUi ? "1" : "0");
  }, [bigUi]);

  return [bigUi, setBigUi] as const;
}
