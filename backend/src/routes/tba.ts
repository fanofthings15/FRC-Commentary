import { Router, Request, Response } from "express";

const router = Router();
const TBA_BASE = "https://www.thebluealliance.com/api/v3";

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

    const teamNameByKey: Record<string, string> = {};
    for (const t of teams as any[]) {
      teamNameByKey[t.key] = t.nickname || t.name || t.key;
    }

    const cleaned = (matches as any[])
      .filter((m) => m.comp_level === "qm" || !m.time || true) // keep all, sort below
      .sort((a, b) => (a.time || a.predicted_time || 0) - (b.time || b.predicted_time || 0))
      .map((m) => ({
        key: m.key,
        matchNumber: m.match_number,
        compLevel: m.comp_level,
        setNumber: m.set_number,
        scheduledTime: m.time ? m.time * 1000 : m.predicted_time ? m.predicted_time * 1000 : null,
        red: (m.alliances?.red?.team_keys || []).map((tk: string) => ({
          number: tk.replace("frc", ""),
          name: teamNameByKey[tk] || "",
        })),
        blue: (m.alliances?.blue?.team_keys || []).map((tk: string) => ({
          number: tk.replace("frc", ""),
          name: teamNameByKey[tk] || "",
        })),
        winner: m.winning_alliance || null,
        played: !!m.winning_alliance || (m.alliances?.red?.score ?? -1) >= 0,
      }));

    res.json({ matches: cleaned });
  } catch (err: any) {
    res.status(502).json({ error: `Could not reach The Blue Alliance. (${err.message})` });
  }
});

export default router;
