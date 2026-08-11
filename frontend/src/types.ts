export interface Settings {
  youtubeVideoId: string;
  tbaApiKey: string;
  tbaEventKey: string;
  vmixHost: string;
  vmixPort: string;
  backendUrl: string;
}

export const DEFAULT_SETTINGS: Settings = {
  youtubeVideoId: "",
  tbaApiKey: "",
  tbaEventKey: "",
  vmixHost: "",
  vmixPort: "8088",
  backendUrl: "http://localhost:4000",
};

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
