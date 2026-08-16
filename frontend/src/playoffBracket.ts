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

// ============================================================================
// EVENT-SPECIFIC: 5-alliance bracket support
//
// Added for a specific event running with only 5 alliances instead of the
// usual 8. FRC's 5-alliance double-elimination bracket omits the bye-only
// slots (1, 3, 4, 5, 6, 9) that exist in the full 8-alliance template - the
// matches that DO get played (2, 7, 8, 10, 11, 12, 13) are wired differently
// than their 8-alliance counterparts of the same number. For example match 7
// is an UPPER bracket match here; in the 8-alliance shape above it's a LOWER
// bracket match. Reusing SF_ADVANCEMENT for a 5-alliance event would produce
// wrong "W -> Match N" labels and fail to draw the connector lines at all
// (since the target match numbers it points to, like Match 5, never get
// scheduled with only 5 alliances).
//
// Verified against FRC's official 5-alliance bracket diagram (FRC Nexus,
// guides.frc.nexus/guides/playoff-brackets) and cross-checked against this
// event's actual TBA bracket.
//
// To roll this back once the event is over: delete this block
// (FIVE_ALLIANCE_ADVANCEMENT, FIVE_ALLIANCE_ROUNDS, isFiveAllianceFormat) and
// the small branch in PlayoffBracket.tsx that references them. Nothing above
// this line, and nothing else in the app, depends on it.
export const FIVE_ALLIANCE_ADVANCEMENT: Record<number, AdvancementInfo> = {
  2: { winnerTo: "Match 7", loserTo: "Match 10" },
  7: { winnerTo: "Match 11", loserTo: "Match 12" },
  8: { winnerTo: "Match 11", loserTo: "Match 10" },
  10: { winnerTo: "Match 12", loserTo: "Eliminated" },
  11: { winnerTo: "Finals", loserTo: "Match 13" },
  12: { winnerTo: "Match 13", loserTo: "Eliminated" },
  13: { winnerTo: "Finals", loserTo: "Eliminated" },
};

// Column grouping matches how TBA itself visually lays out a 5-alliance
// bracket (left-to-right by how many real matches deep a slot is), not the
// theoretical "round number" from the 8-alliance template.
export const FIVE_ALLIANCE_ROUNDS: { title: string; matchNumbers: number[] }[] = [
  { title: "Round 1", matchNumbers: [2, 8] },
  { title: "Round 2", matchNumbers: [7, 10] },
  { title: "Round 3", matchNumbers: [11, 12] },
  { title: "Round 4", matchNumbers: [13] },
];

const FIVE_ALLIANCE_MATCH_NUMBERS = new Set(Object.keys(FIVE_ALLIANCE_ADVANCEMENT).map(Number));

// True only when the event's SF matches are EXACTLY this shape's real
// matches - not a subset or superset - so this never gets misapplied to a
// differently-sized bracket (6/7-alliance events have their own distinct
// shapes that this does not cover).
export function isFiveAllianceFormat(sfMatchNumbers: number[]): boolean {
  const set = new Set(sfMatchNumbers);
  if (set.size !== FIVE_ALLIANCE_MATCH_NUMBERS.size) return false;
  for (const n of set) {
    if (!FIVE_ALLIANCE_MATCH_NUMBERS.has(n)) return false;
  }
  return true;
}
