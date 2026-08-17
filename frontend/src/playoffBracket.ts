// FRC has used a 13-match double-elimination playoff bracket since the 2023 season
// (replacing the older best-of-3 Quarterfinal/Semifinal/Final format). This maps out
// that standard bracket so we can label which match a winner/loser advances to.
//
// If an event doesn't follow this shape (fewer than 8 alliances, or an older-format
// event), we don't try to guess — the UI falls back to a plain match list instead of
// showing potentially-wrong advancement text.

export interface AdvancementInfo {
  winnerTo?: string;
  loserTo?: string;
}

export const SF_ADVANCEMENT: Record<number, AdvancementInfo> = {
  1: { winnerTo: "Match 5", loserTo: "Match 7" },
  2: { winnerTo: "Match 5", loserTo: "Match 7" },
  3: { winnerTo: "Match 6", loserTo: "Match 8" },
  4: { winnerTo: "Match 6", loserTo: "Match 8" },
  5: { winnerTo: "Match 11", loserTo: "Match 10" },
  6: { winnerTo: "Match 11", loserTo: "Match 9" },
  7: { winnerTo: "Match 9", loserTo: "Eliminated" },
  8: { winnerTo: "Match 10", loserTo: "Eliminated" },
  9: { winnerTo: "Match 12", loserTo: "Eliminated" },
  10: { winnerTo: "Match 12", loserTo: "Eliminated" },
  11: { winnerTo: "Finals", loserTo: "Match 13" },
  12: { winnerTo: "Match 13", loserTo: "Eliminated" },
  13: { winnerTo: "Finals", loserTo: "Eliminated" },
};

export const SF_ROUNDS: { title: string; matchNumbers: number[] }[] = [
  { title: "Round 1", matchNumbers: [1, 2, 3, 4] },
  { title: "Round 2", matchNumbers: [5, 6, 7, 8] },
  { title: "Round 3", matchNumbers: [9, 10] },
  { title: "Round 4", matchNumbers: [11, 12] },
  { title: "Bracket Final", matchNumbers: [13] },
];

// A real double-elim bracket always has SF matches numbered up to 13.
// Older-format events only go up to sf2 (best-of-3 semis) — that's our signal
// to fall back rather than apply this map.
export function isDoubleElimFormat(sfMatchNumbers: number[]): boolean {
  return sfMatchNumbers.some((n) => n >= 5);
}
