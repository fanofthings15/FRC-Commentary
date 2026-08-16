import { z } from "zod";

// The app's Settings, defined once here as a Zod schema. The static `Settings`
// type and the runtime validator both come from this single definition, so the
// backend (which validates and stores it) and the frontend (which edits it)
// can never disagree about its shape.
//
// Every field defaults to a sensible empty value, so `settingsSchema.parse({})`
// gives you a complete Settings object — that's exactly what DEFAULT_SETTINGS
// is below.
export const settingsSchema = z.object({
  youtubeVideoId: z.string().default(""),
  // YouTube Data API v3 key, used for the live viewer + watch-hour stats.
  youtubeApiKey: z.string().default(""),
  tbaApiKey: z.string().default(""),
  tbaEventKey: z.string().default(""),
  vmixHost: z.string().default(""),
  vmixPort: z.string().default("8088"),
  // Optional override; auto-derived from vmixHost/vmixPort when left empty.
  telestratorUrl: z.string().default(""),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = settingsSchema.parse({});

// vMix's built-in telestrator is served from the same web controller as its API,
// so by default it lives at http://<vmixHost>:<vmixPort>/telestrator/.
// A manual override is still available in Settings for non-standard setups.
export function resolveTelestratorUrl(settings: Settings): string {
  if (settings.telestratorUrl) return settings.telestratorUrl;
  if (!settings.vmixHost) return "";
  return `http://${settings.vmixHost}:${settings.vmixPort || "8088"}/telestrator/`;
}
