import { Router, Request, Response } from "express";

const router = Router();
const TBA_BASE = "https://www.thebluealliance.com/api/v3";

function hometownFor(t: any): string {
  const parts = [t.city, t.state_prov || t.country].filter(Boolean);
  return parts.join(", ");
}

// GET /api/tba/matches?eventKey=2026miket&apiKey=...
router.get("/matches", async (req: Request, res: Response) => {
  const eventKey = req.query.eventKey as string | undefined;
  const apiKey = req.query.apiKey as string | undefined;

  if (!eventKey || !apiKey) {
    return res.status(400).json({ error: "Missing 'eventKey' or 'apiKey' (set both in Settings)" });
  }

  try {
    const [matchesResp, teamsResp] = await Promise.all([
      fetch(`${TBA_BASE}/event/${eventKey}/matches/simple`, {
        headers: { "X-TBA-Auth-Key": apiKey },
      }),
      fetch(`${TBA_BASE}/event/${eventKey}/teams/simple`, {
        headers: { "X-TBA-Auth-Key": apiKey },
      }),
    ]);

    if (!matchesResp.ok) {
      return res.status(matchesResp.status).json({ error: "TBA rejected the request. Check your API key and event key." });
    }

    const matches = await matchesResp.json();
    const teams = teamsResp.ok ? await teamsResp.json() : [];

    const teamInfoByKey: Record<string, { name: string; hometown: string }> = {};
    for (const t of teams as any[]) {
      teamInfoByKey[t.key] = {
        name: t.nickname || t.name || t.key,
        hometown: hometownFor(t),
      };
    }

    const cleaned = (matches as any[])
      .sort((a, b) => (a.time || a.predicted_time || 0) - (b.time || b.predicted_time || 0))
      .map((m) => ({
        key: m.key,
        matchNumber: m.match_number,
        compLevel: m.comp_level,
        setNumber: m.set_number,
        scheduledTime: m.time ? m.time * 1000 : m.predicted_time ? m.predicted_time * 1000 : null,
        red: (m.alliances?.red?.team_keys || []).map((tk: string) => ({
          number: tk.replace("frc", ""),
          name: teamInfoByKey[tk]?.name || "",
          hometown: teamInfoByKey[tk]?.hometown || "",
        })),
        blue: (m.alliances?.blue?.team_keys || []).map((tk: string) => ({
          number: tk.replace("frc", ""),
          name: teamInfoByKey[tk]?.name || "",
          hometown: teamInfoByKey[tk]?.hometown || "",
        })),
        winner: m.winning_alliance || null,
        played: !!m.winning_alliance || (m.alliances?.red?.score ?? -1) >= 0,
      }));

    res.json({ matches: cleaned });
  } catch (err: any) {
    res.status(502).json({ error: `Could not reach The Blue Alliance. (${err.message})` });
  }
});

// GET /api/tba/rankings?eventKey=2026miket&apiKey=...
router.get("/rankings", async (req: Request, res: Response) => {
  const eventKey = req.query.eventKey as string | undefined;
  const apiKey = req.query.apiKey as string | undefined;

  if (!eventKey || !apiKey) {
    return res.status(400).json({ error: "Missing 'eventKey' or 'apiKey' (set both in Settings)" });
  }

  try {
    const r = await fetch(`${TBA_BASE}/event/${eventKey}/rankings`, {
      headers: { "X-TBA-Auth-Key": apiKey },
    });
    if (!r.ok) {
      return res.status(r.status).json({ error: "TBA rejected the request. Check your API key and event key." });
    }
    const data = await r.json();
    const rankings = ((data as any)?.rankings || []).map((rk: any) => ({
      rank: rk.rank,
      teamNumber: String(rk.team_key || "").replace("frc", ""),
      wins: rk.record?.wins ?? null,
      losses: rk.record?.losses ?? null,
      ties: rk.record?.ties ?? null,
      played: rk.matches_played ?? null,
    }));
    res.json({ rankings });
  } catch (err: any) {
    res.status(502).json({ error: `Could not reach The Blue Alliance. (${err.message})` });
  }
});

// GET /api/tba/alliances?eventKey=2026miket&apiKey=...
router.get("/alliances", async (req: Request, res: Response) => {
  const eventKey = req.query.eventKey as string | undefined;
  const apiKey = req.query.apiKey as string | undefined;

  if (!eventKey || !apiKey) {
    return res.status(400).json({ error: "Missing 'eventKey' or 'apiKey' (set both in Settings)" });
  }

  try {
    const [allianceResp, teamsResp] = await Promise.all([
      fetch(`${TBA_BASE}/event/${eventKey}/alliances`, {
        headers: { "X-TBA-Auth-Key": apiKey },
      }),
      fetch(`${TBA_BASE}/event/${eventKey}/teams/simple`, {
        headers: { "X-TBA-Auth-Key": apiKey },
      }),
    ]);

    if (!allianceResp.ok) {
      return res.status(allianceResp.status).json({ error: "TBA rejected the request. Check your API key and event key." });
    }

    const alliances = await allianceResp.json();
    const teams = teamsResp.ok ? await teamsResp.json() : [];

    const nameByKey: Record<string, string> = {};
    for (const t of teams as any[]) {
      nameByKey[t.key] = t.nickname || t.name || t.key;
    }

    const cleaned = ((alliances as any[]) || []).map((a, idx) => ({
      number: idx + 1,
      name: a.name || `Alliance ${idx + 1}`,
      teams: (a.picks || []).map((tk: string) => ({
        number: tk.replace("frc", ""),
        name: nameByKey[tk] || "",
      })),
    }));

    res.json({ alliances: cleaned });
  } catch (err: any) {
    res.status(502).json({ error: `Could not reach The Blue Alliance. (${err.message})` });
  }
});

// GET /api/tba/team-recent?teamNumber=1114&apiKey=...&year=2026
router.get("/team-recent", async (req: Request, res: Response) => {
  const teamNumber = req.query.teamNumber as string | undefined;
  const apiKey = req.query.apiKey as string | undefined;
  const year = (req.query.year as string | undefined) || String(new Date().getFullYear());

  if (!teamNumber || !apiKey) {
    return res.status(400).json({ error: "Missing 'teamNumber' or 'apiKey'" });
  }

  const teamKey = `frc${teamNumber}`;

  try {
    const [teamResp, eventsResp, statusResp] = await Promise.all([
      fetch(`${TBA_BASE}/team/${teamKey}/simple`, { headers: { "X-TBA-Auth-Key": apiKey } }),
      fetch(`${TBA_BASE}/team/${teamKey}/events/${year}/simple`, { headers: { "X-TBA-Auth-Key": apiKey } }),
      fetch(`${TBA_BASE}/team/${teamKey}/events/${year}/statuses`, { headers: { "X-TBA-Auth-Key": apiKey } }),
    ]);

    if (!teamResp.ok) {
      return res.status(teamResp.status).json({ error: "Team not found, or TBA rejected the request." });
    }

    const team = await teamResp.json();
    const events = eventsResp.ok ? await eventsResp.json() : [];
    const statuses = statusResp.ok ? await statusResp.json() : {};

    const eventList = (events as any[])
      .map((e) => {
        const status = (statuses as any)?.[e.key];
        const ranking = status?.qual?.ranking;
        return {
          eventKey: e.key,
          eventName: e.name,
          startDate: e.start_date || null,
          rank: ranking?.rank ?? null,
          wins: ranking?.record?.wins ?? null,
          losses: ranking?.record?.losses ?? null,
          ties: ranking?.record?.ties ?? null,
        };
      })
      .filter((e) => e.startDate)
      .sort((a, b) => (a.startDate! < b.startDate! ? 1 : -1)); // most recent first

    res.json({
      team: {
        number: String(team.team_number),
        name: team.nickname || team.name || teamKey,
        hometown: hometownFor(team),
        rookieYear: team.rookie_year ?? null,
      },
      season: Number(year),
      events: eventList,
    });
  } catch (err: any) {
    res.status(502).json({ error: `Could not reach The Blue Alliance. (${err.message})` });
  }
});

export default router;
