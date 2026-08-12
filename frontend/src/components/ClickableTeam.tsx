import React from "react";
import { useTeamPopup } from "../context/TeamPopupContext";

export function ClickableTeam({ number }: { number: string }) {
  const { openTeam } = useTeamPopup();
  return (
    <button
      type="button"
      className="team-link"
      onClick={(e) => {
        e.stopPropagation();
        openTeam(number);
      }}
    >
      {number}
    </button>
  );
}
