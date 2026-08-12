import React from "react";
import { useTeamPopup } from "../context/TeamPopupContext";

export function ClickableTeam({ number, className }: { number: string; className?: string }) {
  const { openTeam } = useTeamPopup();
  return (
    <button
      type="button"
      className={`team-link ${className ?? ""}`}
      onClick={(e) => {
        e.stopPropagation();
        openTeam(number);
      }}
    >
      {number}
    </button>
  );
}
