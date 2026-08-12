import React, { createContext, useContext, useState } from "react";
import { Settings } from "../types";
import { TeamPopup } from "../components/TeamPopup";

interface TeamPopupContextValue {
  openTeam: (teamNumber: string) => void;
}

const TeamPopupContext = createContext<TeamPopupContextValue | null>(null);

export function useTeamPopup() {
  const ctx = useContext(TeamPopupContext);
  if (!ctx) throw new Error("useTeamPopup must be used within TeamPopupProvider");
  return ctx;
}

export function TeamPopupProvider({ settings, children }: { settings: Settings; children: React.ReactNode }) {
  const [openNumber, setOpenNumber] = useState<string | null>(null);

  return (
    <TeamPopupContext.Provider value={{ openTeam: setOpenNumber }}>
      {children}
      {openNumber && (
        <TeamPopup teamNumber={openNumber} settings={settings} onClose={() => setOpenNumber(null)} />
      )}
    </TeamPopupContext.Provider>
  );
}
