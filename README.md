# FRC Commentary Dashboard

A single-screen dashboard for FIRST Robotics Competition live commentary teams.

Panels:
- **YouTube Live Chat** — embed of the stream's live chat
- **Match Schedule / Match Browser** — upcoming and past matches with team numbers, names, hometowns, and current rank, pulled from The Blue Alliance. Includes tabs for Rankings, the Playoff Bracket, and the 8 playoff Alliances.
- **Telestrator launcher** — vMix's telestrator opens in its own properly-sized window, auto-derived from your vMix host in Settings.
- **Alerts** — a "Producer" view to send preset or custom messages (e.g. "wrap up") to the Commentator View, where they appear as a banner without covering the chat/matches underneath.

---

## Requirements

- [Bun](https://bun.sh) installed on the laptop/PC you'll run this from at the event
- That machine must be on the same local network as the vMix PC

## Project layout

```
frc-commentary/
  backend/     Express + TypeScript API (proxies vMix + The Blue Alliance, hosts the alerts WebSocket, serves the built frontend)
  frontend/    React + TypeScript (Vite) dashboard UI
  scripts/     dev.ts (runs both dev servers together) and zip-ui.ts (packages the built UI for the .exe)
```


## Running it locally (dev)

From the repo root:

```bash
bun install
bun run dev
```

This starts both the backend (`:3010`) and the Vite dev server (`:5173`). Open **http://localhost:5173**

## Releasing a new version

Push a version tag:

```bash
git tag v1.1.0
git push origin v1.1.0
```

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

Settings save per-browser. Each teammate opening the app on their own device will need to enter these once too — this is unaffected by the dev/prod/exe changes above.

## Using the Alerts panel

- **Commentator view** (`#/commentator`): shows chat, matches, and a telestrator launcher, with incoming alerts appearing as a banner. Put this on the commentator's screen.
- **Main dashboard**: the Alerts panel here has buttons for preset messages (Wrap Up, Go to Break, Match Starting, Stand By, All Clear) plus a text box for anything custom.

## Notes on vMix

The backend calls vMix's built-in HTTP API (`http://<host>:<port>/api`), enabled by default in vMix. No plugin needed.

## Deploying for an event day

Run `app.exe` on one laptop connected to the venue Wi-Fi/LAN that the vMix machine is also on, then have commentators open `http://<that laptop's IP>:3010` from their own devices on the same network.
