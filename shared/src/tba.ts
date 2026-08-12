import { z } from "zod";

// The shapes the backend sends to the frontend after cleaning up TBA's raw
// responses. These are the wire contract between the two halves of the app —
// NOT TBA's own API shapes (those live in backend/src/types/tba.ts). Defining
// them here once means the frontend never re-declares them by hand.

export const teamRefSchema = z.object({
  number: z.string(),
  name: z.string(),
  hometown: z.string().optional(),
});
export type TeamRef = z.infer<typeof teamRefSchema>;

export const matchInfoSchema = z.object({
  key: z.string(),
  matchNumber: z.number(),
  compLevel: z.string(),
  setNumber: z.number(),
  scheduledTime: z.number().nullable(),
  red: z.array(teamRefSchema),
  blue: z.array(teamRefSchema),
  winner: z.string().nullable(),
  played: z.boolean(),
});
export type MatchInfo = z.infer<typeof matchInfoSchema>;

export const rankingEntrySchema = z.object({
  rank: z.number(),
  teamNumber: z.string(),
  wins: z.number().nullable(),
  losses: z.number().nullable(),
  ties: z.number().nullable(),
  played: z.number().nullable(),
});
export type RankingEntry = z.infer<typeof rankingEntrySchema>;

export const allianceEntrySchema = z.object({
  number: z.number(),
  name: z.string(),
  teams: z.array(z.object({ number: z.string(), name: z.string() })),
});
export type AllianceEntry = z.infer<typeof allianceEntrySchema>;
