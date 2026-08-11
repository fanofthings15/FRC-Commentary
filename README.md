# FRC Commentary Dashboard

A single-screen dashboard for FIRST Robotics Competition live commentary teams.

Panels:
- **YouTube Live Chat** — embed of the stream's live chat
- **Match Schedule / Match Browser** — upcoming and past matches with team numbers/names, pulled from The Blue Alliance. The Commentator View's browser lets you step back through completed matches or peek ahead with Previous/Next.
- **Telestrator** — embedded directly in the Commentator View, so commentators can draw on it without a separate tab. vMix serves this from the same address as its API (default `http://<vmix host>:8088/telestrator/`); no separate setup needed beyond your vMix host in Settings.
- **vMix Status** — read-only tally showing what's on program/preview and recording status. There are no cut/switch controls here on purpose — that stays in vMix itself with whoever's on the board.
- **Alerts** — a "Producer" view to send preset or custom messages (e.g. "wrap up") to the Commentator View, where they appear as a banner without covering the chat/telestrator/matches underneath.

**No API keys or IPs are hard-coded anywhere in the code.** Everything (TBA API key, event key, vMix host/port, YouTube video ID) is entered in the in-app **Settings** menu and saved to your browser's local storage. You can change any of it at any time without redeploying.

---

## Requirements

- [Bun](https://bun.sh) installed on the laptop/PC you'll run this from at the event (`curl -fsSL https://bun.sh/install | bash` on Mac/Linux, or see bun.sh/docs/installation for Windows)
- That machine must be on the same local network as the vMix PC

## Project layout

```
frc-commentary/
  backend/    Node + Express + TypeScript API (proxies vMix + The Blue Alliance, hosts the alerts WebSocket)
  frontend/   React + TypeScript (Vite) dashboard UI
```

The backend exists mainly because:
1. Browsers block cross-origin requests to vMix's local API by default (CORS) — the backend proxies around this.
2. It keeps a single WebSocket hub so "Producer" and "Commentator" views (which might be two different browser tabs/laptops) can talk to each other.

## Running it locally

Open two terminals.

**Backend:**
```bash
cd backend
bun install
bun run dev
```
Runs on http://localhost:48213

**Frontend:**
```bash
cd frontend
bun install
bun run dev
```
Runs on http://localhost:5173 — open this in your browser.

## First-time setup (in the app)

Click **Settings** (top right) and fill in:

| Field | Where to get it |
|---|---|
| YouTube Video ID | The `v=` part of your live stream's YouTube URL |
| TBA API Key | https://www.thebluealliance.com/account → API Keys → generate a **Read API Key** |
| TBA Event Key | e.g. `2026miket` — found in the URL of your event on thebluealliance.com |
| vMix Host | IP address of the vMix PC on the local network, e.g. `192.168.1.50` |
| vMix Port | Default vMix web controller port is `8088` |
| Telestrator URL (optional) | Leave blank — it's auto-derived as `http://<vMix Host>:<vMix Port>/telestrator/`. Only set this if your telestrator lives somewhere non-standard. |

Settings save automatically and persist between sessions (per browser). Each teammate opening the app on their own laptop will need to enter these once too.

## Using the Alerts panel

- **Commentator view** (`/commentator`): fullscreen, shows incoming alerts as a large banner. Put this on the commentator's screen.
- **Producer view** (`/producer`, or the main dashboard's Alerts panel): buttons for preset messages (Wrap Up, Go to Break, Match Starting, Stand By, All Clear) plus a text box to send anything custom.

Both connect to the backend's WebSocket, so they work across two different machines on the same network — just point both at the same backend (set the backend URL in Settings if not running on the same machine as the frontend).

## Notes on vMix

The backend calls vMix's built-in HTTP API (`http://<host>:<port>/api`), which is enabled by default in vMix. No plugin needed. Because telestrator/replay run as vMix inputs/overlays in your setup, they're controlled the same way as any other input — cut to them or toggle their overlay from the vMix panel like any other source. If you later add a title for "Telestrator" or "Replay" as a named input, it'll show up automatically in the input list.

## Deploying for an event day

Simplest approach: run both `backend` and `frontend` (or a built version of the frontend) on one laptop connected to the venue Wi-Fi/LAN that the vMix machine is also on, then have commentators open the dashboard URL from their own devices on that same network.
