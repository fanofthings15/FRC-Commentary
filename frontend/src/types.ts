export interface Settings {
  youtubeVideoId: string;
  tbaApiKey: string;
  tbaEventKey: string;
  vmixHost: string;
  vmixPort: string;
  backendUrl: string;
  telestratorUrl: string; // optional override; auto-derived from vmixHost/vmixPort when empty
}

export const DEFAULT_SETTINGS: Settings = {
  youtubeVideoId: "",
  tbaApiKey: "",
  tbaEventKey: "",
  vmixHost: "",
  vmixPort: "8088",
  backendUrl: "http://localhost:4000",
  telestratorUrl: "",
};

// vMix's built-in telestrator is served from the same web controller as its API,
// so by default it lives at http://<vmixHost>:<vmixPort>/telestrator/.
// A manual override is still available in Settings for non-standard setups.
export function resolveTelestratorUrl(settings: Settings): string {
  if (settings.telestratorUrl) return settings.telestratorUrl;
  if (!settings.vmixHost) return "";
  return `http://${settings.vmixHost}:${settings.vmixPort || "8088"}/telestrator/`;
}

export interface TeamRef {
  number: string;
  name: string;
}

export interface MatchInfo {
  key: string;
  matchNumber: number;
  compLevel: string;
  setNumber: number;
  scheduledTime: number | null;
  red: TeamRef[];
  blue: TeamRef[];
  winner: string | null;
  played: boolean;
}

export interface VmixInput {
  number: string;
  key: string;
  type: string;
  title: string;
  state: string;
}

export interface VmixStatus {
  active: string;
  preview: string;
  recording: boolean;
  streaming: boolean;
  external: boolean;
  inputs: VmixInput[];
}

export interface AlertMessage {
  type: "alert";
  text: string;
  sentAt: number;
}
