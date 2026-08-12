// The Blue Alliance API v3 response shapes.
//
// Hand-written from TBA's official OpenAPI 3.1 spec
// (https://www.thebluealliance.com/swagger/api_v3.json), covering only the
// models this backend actually consumes: the `/simple` model variants for
// matches and teams, the event rankings object, and elimination alliances.
// Field-level docs below are condensed from that spec.

export type CompLevel = "qm" | "ef" | "qf" | "sf" | "f";

// Winning-alliance color. TBA returns an empty string for an unplayed match,
// a tie, or a match with no winner yet.
export type AllianceColor = "red" | "blue" | "";

export interface WltRecord {
  losses: number;
  wins: number;
  ties: number;
}

// One side (red or blue) of a match.
export interface MatchAlliance {
  /** Score for this alliance. -1 for an unplayed match. */
  score: number;
  /** TBA team keys (e.g. `frc254`) on this alliance. */
  team_keys: string[];
  /** Team keys of any teams playing as a surrogate. */
  surrogate_team_keys: string[];
  /** Team keys of any disqualified teams. */
  dq_team_keys: string[];
}

// GET /event/{event_key}/matches/simple -> MatchSimple[]
export interface MatchSimple {
  key: string;
  comp_level: CompLevel;
  set_number: number;
  match_number: number;
  alliances: { red: MatchAlliance; blue: MatchAlliance };
  winning_alliance: AllianceColor;
  event_key: string;
  /** UNIX seconds of the scheduled match time. */
  time: number | null;
  /** UNIX seconds of TBA's predicted start time. */
  predicted_time: number | null;
  /** UNIX seconds of the actual start time. */
  actual_time: number | null;
}

// GET /event/{event_key}/teams/simple -> TeamSimple[]
export interface TeamSimple {
  key: string;
  team_number: number;
  nickname: string;
  name: string;
  city: string | null;
  state_prov: string | null;
  country: string | null;
}

export interface EventRankingEntry {
  matches_played: number;
  qual_average: number | null;
  extra_stats: number[];
  sort_orders: number[];
  record: WltRecord | null;
  rank: number;
  dq: number;
  team_key: string;
}

export interface RankingStatInfo {
  name: string;
  precision: number;
}

// GET /event/{event_key}/rankings -> EventRankings
export interface EventRankings {
  rankings: EventRankingEntry[];
  extra_stats_info: RankingStatInfo[];
  sort_order_info: RankingStatInfo[] | null;
}

// GET /event/{event_key}/alliances -> EliminationAlliance[]
export interface EliminationAlliance {
  name?: string;
  backup?: { in: string; out: string } | null;
  /** Team keys that declined the alliance. */
  declines: string[];
  /** Team keys picked for the alliance. First pick is the captain. */
  picks: string[];
  status?: {
    playoff_average?: number | null;
    level?: CompLevel;
    record?: WltRecord | null;
    current_level_record?: WltRecord | null;
    status?: "eliminated" | "playing" | "won";
  };
}
