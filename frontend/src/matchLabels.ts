export function compLevelLabel(level: string) {
  switch (level) {
    case "qm": return "Qual";
    case "qf": return "Quarters";
    case "sf": return "Semis";
    case "f": return "Finals";
    default: return level.toUpperCase();
  }
}

// TBA numbers matches differently depending on the round:
// - Qualification (qm): matchNumber is the match number (1, 2, 3...) — what you'd expect.
// - Playoffs (qf/sf): setNumber identifies WHICH bracket matchup this is (e.g. 1
//   through 13 in the modern double-elim format); matchNumber stays at 1 unless
//   a tiebreaker replay was needed.
// - Finals (f): the opposite — setNumber stays at 1 (there's only one finals
//   matchup), and matchNumber counts the games (1, 2, and a 3rd only if needed).
// This picks whichever field actually identifies "which match is this" for the round.
export function matchDisplayNumber(m: { compLevel: string; matchNumber: number; setNumber: number }): number {
  if (m.compLevel === "qm" || m.compLevel === "f") return m.matchNumber;
  return m.setNumber;
}
