export function compLevelLabel(level: string) {
  switch (level) {
    case "qm": return "Qual";
    case "qf": return "Quarters";
    case "sf": return "Semis";
    case "f": return "Finals";
    default: return level.toUpperCase();
  }
}
