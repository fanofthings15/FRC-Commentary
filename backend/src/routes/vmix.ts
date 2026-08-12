import { Router, Request, Response } from "express";
import { parseStringPromise } from "xml2js";

const router = Router();

function vmixBaseUrl(req: Request): string | null {
  const host = req.query.host as string | undefined;
  const port = (req.query.port as string | undefined) || "8088";
  if (!host) return null;
  return `http://${host}:${port}/api`;
}

// GET /api/vmix/status?host=...&port=...
router.get("/status", async (req: Request, res: Response) => {
  const base = vmixBaseUrl(req);
  if (!base) {
    return res.status(400).json({ error: "Missing 'host' query param (set vMix host in Settings)" });
  }
  try {
    const r = await fetch(base, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) {
      return res.status(502).json({ error: `vMix responded with status ${r.status}` });
    }
    const xml = await r.text();
    const parsed = await parseStringPromise(xml, { explicitArray: false });
    const vmix = parsed?.vmix;
    if (!vmix) {
      return res.status(502).json({ error: "Unexpected response from vMix" });
    }

    const inputsRaw = vmix.inputs?.input;
    const inputs = Array.isArray(inputsRaw) ? inputsRaw : inputsRaw ? [inputsRaw] : [];

    res.json({
      active: vmix.active,
      preview: vmix.preview,
      recording: vmix.recording === "True",
      streaming: vmix.streaming === "True",
      external: vmix.external === "True",
      inputs: inputs.map((i: any) => ({
        number: i.$?.number,
        key: i.$?.key,
        type: i.$?.type,
        title: i.$?.title || i._,
        state: i.$?.state,
      })),
    });
  } catch (err: any) {
    res.status(502).json({ error: `Could not reach vMix at ${base}. Check host/port/network. (${err.message})` });
  }
});

// POST /api/vmix/command?host=...&port=...&function=Cut&input=3
router.post("/command", async (req: Request, res: Response) => {
  const base = vmixBaseUrl(req);
  if (!base) {
    return res.status(400).json({ error: "Missing 'host' query param (set vMix host in Settings)" });
  }
  const { function: fn, input, value } = req.query;
  if (!fn) {
    return res.status(400).json({ error: "Missing 'function' query param, e.g. Cut, OverlayInput1, ReplayPlay" });
  }
  const params = new URLSearchParams();
  params.set("Function", String(fn));
  if (input) params.set("Input", String(input));
  if (value) params.set("Value", String(value));

  try {
    const r = await fetch(`${base}/?${params.toString()}`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) {
      return res.status(502).json({ error: `vMix responded with status ${r.status}` });
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(502).json({ error: `Could not reach vMix. (${err.message})` });
  }
});

export default router;
