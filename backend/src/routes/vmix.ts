import { Router, Request, Response } from "express";
import { parseStringPromise } from "xml2js";
import { queryString, errorMessage } from "../util.js";

const router = Router();

// Shape of the vMix `/api` XML once xml2js has parsed it with
// `explicitArray: false`. Element attributes land under `$`, and an element's
// text content (e.g. an input title) lands under `_`.
interface VmixInputXml {
  $?: { number?: string; key?: string; type?: string; title?: string; state?: string };
  _?: string;
}
interface VmixXml {
  active?: string;
  preview?: string;
  recording?: string;
  streaming?: string;
  external?: string;
  inputs?: { input?: VmixInputXml | VmixInputXml[] };
}
interface VmixApiResponse {
  vmix?: VmixXml;
}

function vmixBaseUrl(req: Request): string | null {
  const host = queryString(req, "host");
  const port = queryString(req, "port") || "8088";
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
    const parsed = (await parseStringPromise(xml, { explicitArray: false })) as VmixApiResponse;
    const vmix = parsed?.vmix;
    if (!vmix) {
      return res.status(502).json({ error: "Unexpected response from vMix" });
    }

    const inputsRaw = vmix.inputs?.input;
    const inputs: VmixInputXml[] = Array.isArray(inputsRaw) ? inputsRaw : inputsRaw ? [inputsRaw] : [];

    res.json({
      active: vmix.active,
      preview: vmix.preview,
      recording: vmix.recording === "True",
      streaming: vmix.streaming === "True",
      external: vmix.external === "True",
      inputs: inputs.map((i) => ({
        number: i.$?.number,
        key: i.$?.key,
        type: i.$?.type,
        title: i.$?.title || i._,
        state: i.$?.state,
      })),
    });
  } catch (err) {
    res.status(502).json({ error: `Could not reach vMix at ${base}. Check host/port/network. (${errorMessage(err)})` });
  }
});

// POST /api/vmix/command?host=...&port=...&function=Cut&input=3
router.post("/command", async (req: Request, res: Response) => {
  const base = vmixBaseUrl(req);
  if (!base) {
    return res.status(400).json({ error: "Missing 'host' query param (set vMix host in Settings)" });
  }
  const fn = queryString(req, "function");
  const input = queryString(req, "input");
  const value = queryString(req, "value");
  if (!fn) {
    return res.status(400).json({ error: "Missing 'function' query param, e.g. Cut, OverlayInput1, ReplayPlay" });
  }
  const params = new URLSearchParams();
  params.set("Function", fn);
  if (input) params.set("Input", input);
  if (value) params.set("Value", value);

  try {
    const r = await fetch(`${base}/?${params.toString()}`, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) {
      return res.status(502).json({ error: `vMix responded with status ${r.status}` });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: `Could not reach vMix. (${errorMessage(err)})` });
  }
});

export default router;
