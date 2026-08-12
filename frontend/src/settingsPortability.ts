import { DEFAULT_SETTINGS, Settings } from "./types";

export function settingsToJson(settings: Settings): string {
  return JSON.stringify(settings, null, 2);
}

// Merges parsed JSON with defaults (so a partial/older export doesn't blow up
// on missing fields) and does light shape validation. Returns an error
// message instead of throwing, so the UI can show something useful.
export function parseImportedSettings(text: string): { settings: Settings } | { error: string } {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "That file isn't valid JSON." };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { error: "That file doesn't look like a settings export." };
  }

  const known = Object.keys(DEFAULT_SETTINGS);
  const hasAnyKnownField = known.some((k) => k in parsed);
  if (!hasAnyKnownField) {
    return { error: "That file doesn't contain any recognizable settings fields." };
  }

  const merged: Settings = { ...DEFAULT_SETTINGS };
  for (const key of known) {
    if (key in parsed) {
      (merged as any)[key] = parsed[key];
    }
  }
  // recentEventKeys should always be an array, even if the imported file is malformed there
  if (!Array.isArray(merged.recentEventKeys)) {
    merged.recentEventKeys = [];
  }

  return { settings: merged };
}
