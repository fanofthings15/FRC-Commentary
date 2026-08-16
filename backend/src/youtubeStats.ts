import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import os from "os";
import { loadSettings } from "./settingsStore.js";

// Live YouTube stream stats for the hosts to glance at: how many people are
// watching right now, and a running total of watch hours for the stream.
//
// Two different YouTube surfaces are involved and it matters which one we use:
//   - concurrentViewers (live "watching now") comes from the YouTube Data API
//     v3 and only needs a plain API key. It's near real-time.
//   - true watch hours / average view duration come from the YouTube Analytics
//     API, which needs channel-owner OAuth AND is delayed by up to a day, so it
//     can't reflect the stream that's happening right now.
//
// Since these numbers are for the hosts to watch DURING the broadcast, we don't
// use the Analytics API at all. Instead the backend polls concurrentViewers on
// a fixed interval and integrates it over time (viewers x hours) to accumulate
// a live-climbing watch-hours figure. It's the same quantity YouTube reports,
// just computed live from the moment tracking starts rather than fetched after
// the fact.
//
// The accumulation lives in the BACKEND (not per-browser) so that having three
// dashboards open doesn't triple-count the integral — every open frontend just
// reads the one shared number.

const DATA_DIR = path.join(os.homedir(), ".frc-commentary");
const STATS_PATH = path.join(DATA_DIR, "youtube-stats.json");

// How often the backend samples YouTube. 20s keeps the API-quota cost trivial
// (1 unit/call, 10,000/day default -> ~4,300 units/day here) while being often
// enough for a smooth "watching now" number and an accurate integral.
const POLL_INTERVAL_MS = 20_000;
const YT_API = "https://www.googleapis.com/youtube/v3/videos";

export interface YouTubeStats {
  // Whether a video ID + API key are both set in Settings.
  configured: boolean;
  // concurrentViewers is only present while the video is actually live.
  isLive: boolean;
  concurrentViewers: number | null;
  viewCount: number | null;
  // Accumulated live viewer-hours since we started tracking this video ID.
  watchHours: number;
  videoId: string | null;
  lastUpdated: number | null;
  error: string | null;
}

// What we persist to disk: just the accumulator, keyed by the video it belongs
// to. This is all public data, so plain JSON (not the encrypted settings store)
// is fine. Persisting means an app restart mid-event resumes the running total
// instead of dropping back to zero.
interface Persisted {
  videoId: string;
  watchSeconds: number;
}

const accumulator = {
  videoId: null as string | null,
  watchSeconds: 0,
  lastConcurrent: null as number | null,
  lastSampleAt: null as number | null, // ms epoch of the previous sample
};

let latest: YouTubeStats = {
  configured: false,
  isLive: false,
  concurrentViewers: null,
  viewCount: null,
  watchHours: 0,
  videoId: null,
  lastUpdated: null,
  error: null,
};

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadPersisted(): Persisted | null {
  if (!existsSync(STATS_PATH)) return null;
  try {
    const raw = JSON.parse(readFileSync(STATS_PATH, "utf-8"));
    if (typeof raw?.videoId === "string" && typeof raw?.watchSeconds === "number") {
      return raw as Persisted;
    }
    return null;
  } catch {
    return null;
  }
}

function persist(): void {
  if (!accumulator.videoId) return;
  try {
    ensureDataDir();
    const data: Persisted = {
      videoId: accumulator.videoId,
      watchSeconds: accumulator.watchSeconds,
    };
    writeFileSync(STATS_PATH, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to persist YouTube watch-hours accumulator:", err);
  }
}

// Start (or reset) tracking for a given video ID, seeding from disk if the
// persisted total belongs to this same video.
function startTracking(videoId: string): void {
  const persisted = loadPersisted();
  accumulator.videoId = videoId;
  accumulator.watchSeconds = persisted?.videoId === videoId ? persisted.watchSeconds : 0;
  accumulator.lastConcurrent = null;
  accumulator.lastSampleAt = null;
}

async function poll(): Promise<void> {
  const settings = (loadSettings() as any) || {};
  const videoId = String(settings.youtubeVideoId || "").trim();
  const apiKey = String(settings.youtubeApiKey || "").trim();

  if (!videoId || !apiKey) {
    latest = {
      ...latest,
      configured: false,
      isLive: false,
      concurrentViewers: null,
      error: null,
    };
    return;
  }

  // Reset the running total whenever the tracked video changes.
  if (accumulator.videoId !== videoId) {
    startTracking(videoId);
  }

  try {
    const url =
      `${YT_API}?part=liveStreamingDetails,statistics` +
      `&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    const data: any = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message || `YouTube API rejected the request (${res.status}).`;
      latest = { ...latest, configured: true, videoId, error: msg };
      return;
    }

    const item = data.items?.[0];
    if (!item) {
      latest = { ...latest, configured: true, videoId, error: "No video found for that ID." };
      return;
    }

    const cvRaw = item.liveStreamingDetails?.concurrentViewers;
    const concurrent = cvRaw != null ? Number(cvRaw) : null;
    const viewCount =
      item.statistics?.viewCount != null ? Number(item.statistics.viewCount) : null;
    // concurrentViewers is only reported while the broadcast is actually live.
    const isLive = concurrent != null && !Number.isNaN(concurrent);

    // Integrate watch time between the last sample and now. Trapezoidal: the
    // average of the two endpoint viewer counts times the elapsed time. Only
    // counts intervals where the stream was live at both ends.
    const now = Date.now();
    if (
      accumulator.lastSampleAt != null &&
      accumulator.lastConcurrent != null &&
      concurrent != null
    ) {
      const elapsedSec = (now - accumulator.lastSampleAt) / 1000;
      // Guard against a long gap (laptop sleep, backend paused) turning into a
      // huge bogus chunk of watch time: cap any single interval at 3x the poll
      // period.
      const bounded = Math.min(elapsedSec, (POLL_INTERVAL_MS / 1000) * 3);
      const avgViewers = (concurrent + accumulator.lastConcurrent) / 2;
      accumulator.watchSeconds += avgViewers * bounded;
    }
    accumulator.lastSampleAt = now;
    accumulator.lastConcurrent = concurrent; // null once the stream ends

    persist();

    latest = {
      configured: true,
      isLive,
      concurrentViewers: concurrent,
      viewCount,
      watchHours: accumulator.watchSeconds / 3600,
      videoId,
      lastUpdated: now,
      error: null,
    };
  } catch (err: any) {
    latest = { ...latest, configured: true, videoId, error: `Could not reach YouTube. (${err.message})` };
  }
}

export function getLatestYouTubeStats(): YouTubeStats {
  return latest;
}

// Kick off the background poller. Safe to call once at startup.
export function startYouTubePolling(): void {
  void poll();
  setInterval(() => void poll(), POLL_INTERVAL_MS);
}
