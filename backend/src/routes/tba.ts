import { Router, Request, Response } from "express";
import type { MatchInfo, RankingEntry, AllianceEntry } from "frc-commentary-shared";
import type {
  MatchSimple,
  TeamSimple,
  EventRankings,
  EliminationAlliance,
} from "../types/tba.js";
import { queryString, errorMessage } from "../util.js";

const router = Router();
const TBA_BASE = "https://www.thebluealliance.com/api/v3";

function hometownFor(t: TeamSimple): string {
  const parts = [t.city, t.state_prov || t.country].filter(Boolean);
  return parts.join(", ");
}

function tbaHeaders(apiKey: string): HeadersInit {
  return { "X-TBA-Auth-Key": apiKey };
}

// GET /api/tba/matches?eventKey=2026miket&apiKey=...
router.get("/matches", async (req: Request, res: Response) => {
  const eventKey = queryString(req, "eventKey");
  const apiKey = queryString(req, "apiKey");

  if (!eventKey || !apiKey) {
    return res.status(400).json({ error: "Missing 'eventKey' or 'apiKey' (set both in Settings)" });
  }

  try {
    const [matchesResp, teamsResp] = await Promise.all([
      fetch(`${TBA_BASE}/event/${eventKey}/matches/simple`, { headers: tbaHeaders(apiKey) }),
      fetch(`${TBA_BASE}/event/${eventKey}/teams/simple`, { headers: tbaHeaders(apiKey) }),
    ]);

    if (!matchesResp.ok) {
      return res.status(matchesResp.status).json({ error: "TBA rejected the request. Check your API key and event key." });
    }

    const matches = (await matchesResp.json()) as MatchSimple[];
    const teams = teamsResp.ok ? ((await teamsResp.json()) as TeamSimple[]) : [];

    const teamInfoByKey: Record<string, { name: string; hometown: string }> = {};
    for (const t of teams) {
      teamInfoByKey[t.key] = {
        name: t.nickname || t.name || t.key,
        hometown: hometownFor(t),
      };
    }

    const cleaned: MatchInfo[] = matches
      .slice()
      .sort((a, b) => (a.time || a.predicted_time || 0) - (b.time || b.predicted_time || 0))
      .map((m) => ({
        key: m.key,
        matchNumber: m.match_number,
        compLevel: m.comp_level,
        setNumber: m.set_number,
        scheduledTime: m.time ? m.time * 1000 : m.predicted_time ? m.predicted_time * 1000 : null,
        red: (m.alliances?.red?.team_keys || []).map((tk) => ({
          number: tk.replace("frc", ""),
          name: teamInfoByKey[tk]?.name || "",
          hometown: teamInfoByKey[tk]?.hometown || "",
        })),
        blue: (m.alliances?.blue?.team_keys || []).map((tk) => ({
          number: tk.replace("frc", ""),
          name: teamInfoByKey[tk]?.name || "",
          hometown: teamInfoByKey[tk]?.hometown || "",
        })),
        winner: m.winning_alliance || null,
        played: !!m.winning_alliance || (m.alliances?.red?.score ?? -1) >= 0,
      }));

    res.json({ matches: cleaned });
  } catch (err) {
    res.status(502).json({ error: `Could not reach The Blue Alliance. (${errorMessage(err)})` });
  }
});

// GET /api/tba/rankings?eventKey=2026miket&apiKey=...
router.get("/rankings", async (req: Request, res: Response) => {
  const eventKey = queryString(req, "eventKey");
  const apiKey = queryString(req, "apiKey");

  if (!eventKey || !apiKey) {
    return res.status(400).json({ error: "Missing 'eventKey' or 'apiKey' (set both in Settings)" });
  }

  try {
    const r = await fetch(`${TBA_BASE}/event/${eventKey}/rankings`, { headers: tbaHeaders(apiKey) });
    if (!r.ok) {
      return res.status(r.status).json({ error: "TBA rejected the request. Check your API key and event key." });
    }
    const data = (await r.json()) as EventRankings | null;
    const rankings: RankingEntry[] = (data?.rankings || []).map((rk) => ({
      rank: rk.rank,
      teamNumber: String(rk.team_key || "").replace("frc", ""),
      wins: rk.record?.wins ?? null,
      losses: rk.record?.losses ?? null,
      ties: rk.record?.ties ?? null,
      played: rk.matches_played ?? null,
    }));
    res.json({ rankings });
  } catch (err) {
    res.status(502).json({ error: `Could not reach The Blue Alliance. (${errorMessage(err)})` });
  }
});

// GET /api/tba/alliances?eventKey=2026miket&apiKey=...
router.get("/alliances", async (req: Request, res: Response) => {
  const eventKey = queryString(req, "eventKey");
  const apiKey = queryString(req, "apiKey");

  if (!eventKey || !apiKey) {
    return res.status(400).json({ error: "Missing 'eventKey' or 'apiKey' (set both in Settings)" });
  }

  try {
    const [allianceResp, teamsResp] = await Promise.all([
      fetch(`${TBA_BASE}/event/${eventKey}/alliances`, { headers: tbaHeaders(apiKey) }),
      fetch(`${TBA_BASE}/event/${eventKey}/teams/simple`, { headers: tbaHeaders(apiKey) }),
    ]);

    if (!allianceResp.ok) {
      return res.status(allianceResp.status).json({ error: "TBA rejected the request. Check your API key and event key." });
    }

    const alliances = ((await allianceResp.json()) as EliminationAlliance[]) || [];
    const teams = teamsResp.ok ? ((await teamsResp.json()) as TeamSimple[]) : [];

    const nameByKey: Record<string, string> = {};
    for (const t of teams) {
      nameByKey[t.key] = t.nickname || t.name || t.key;
    }

    const cleaned: AllianceEntry[] = alliances.map((a, idx) => ({
      number: idx + 1,
      name: a.name || `Alliance ${idx + 1}`,
      teams: (a.picks || []).map((tk) => ({
        number: tk.replace("frc", ""),
        name: nameByKey[tk] || "",
      })),
    }));

    res.json({ alliances: cleaned });
  } catch (err) {
    res.status(502).json({ error: `Could not reach The Blue Alliance. (${errorMessage(err)})` });
  }
});

export default router;
