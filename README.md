# FRC Commentary Dashboard

A single-screen dashboard for FIRST Robotics Competition live commentary teams.

Panels:
- **YouTube Live Chat** — embed of the stream's live chat
- **Match Schedule / Match Browser** — upcoming and past matches with team numbers, names, hometowns, and current rank, pulled from The Blue Alliance. Includes tabs for Rankings, the Playoff Bracket (with connected advancement lines), and the 8 playoff Alliances.
- **Telestrator launcher** — vMix's telestrator opens in its own properly-sized window (it doesn't embed well inside another page), auto-derived from your vMix host in Settings.
- **vMix Status** — read-only tally showing what's on program/preview and recording status. There are no cut/switch controls here on purpose — that stays in vMix itself with whoever's on the board.
- **Alerts** — a "Producer" view to send preset or custom messages (e.g. "wrap up") to the Commentator View, where they appear as a banner without covering the chat/matches underneath.

**No API keys or IPs are hard-coded anywhere in the code.** Everything (TBA API key, event key, vMix host/port, YouTube video ID) is entered in the in-app **Settings** menu and saved to your browser's local storage.

---

## Requirements

- [Bun](https://bun.sh) installed on the laptop/PC you'll run this from at the event
- That machine must be on the same local network as the vMix PC

## One-time setup: commit safety hook

This repo has a git hook that physically blocks committing `node_modules`, `dist/`, or compiled `.exe` files — a hard safety net that works even if `.gitignore` somehow isn't respected in a given moment (this happened once already: `node_modules` got committed — 1.6 million lines — because `.gitignore` didn't exist yet at the time a `git init` happened in a folder where `npm install` had already run).

**Run this once per machine**, right after cloning:
```bash
git config core.hooksPath .githooks
```

After that, any commit that would include those files gets blocked automatically with an explanation, on every machine where you've run that command. It's a local git setting, not something that syncs automatically — so if you set up the repo fresh on a new machine, run it there too.

**Extra, optional backstop for every repo on your machine** (not just this one): set a global gitignore so `node_modules` is ignored by default everywhere, even in repos with no `.gitignore` of their own:
```bash
git config --global core.excludesfile ~/.gitignore_global
echo "node_modules/" >> ~/.gitignore_global
```

## Project layout

```
frc-commentary/
  backend/     Express + TypeScript API (proxies vMix + The Blue Alliance, hosts the alerts WebSocket, serves the built frontend)
  frontend/    React + TypeScript (Vite) dashboard UI
  scripts/     dev.ts (runs both dev servers together) and zip-ui.ts (packages the built UI for the .exe)
```

## Dev vs. prod — how this actually works

This trips people up at first, so here's the short version:

**In development**, you're running *two* processes: the Vite dev server (instant hot-reload when you edit frontend code) and the backend (Express, also hot-reloading via `bun --watch`). The browser only ever talks to Vite's port (`5173`) — Vite quietly forwards anything under `/api` or `/ws` to the backend on port `3010` behind the scenes. That's what the `proxy` block in `vite.config.ts` does. `bun run dev` at the repo root starts both for you automatically.

**In production**, there's only *one* process. `vite build` compiles the whole frontend down to a handful of static HTML/CSS/JS files (`frontend/dist`). The backend then just serves those files directly *and* handles the API/WebSocket, all on the same port (`3010`). One origin, no proxy, no CORS — because the browser is talking to exactly one server for everything.

**For distribution**, `bun build --compile` takes that same backend and bakes the entire built frontend into it, producing a single `app.exe`. Nothing to install, nothing to configure, nothing to run in a terminal — whoever's using it just double-clicks the file.

Because the backend always runs on a fixed port (`3010`, never random), and the frontend now always talks to whatever origin it's being served from (no more separately-configured "Backend URL" setting), the same code works unmodified in all three of these situations.

## Running it locally (dev)

From the repo root:

```bash
bun install
bun run dev
```

This starts both the backend (`:3010`) and the Vite dev server (`:5173`). Open **http://localhost:5173** — that's the one you actually use during development.

## Running a production-style build locally

Useful for testing the "one process" setup before compiling it to an exe:

```bash
bun run build:ui        # builds frontend/dist
cd backend && bun run start
```

Then open **http://localhost:3010** directly — no Vite, no separate frontend process, just the backend serving everything.

## Building the distributable .exe

```bash
bun run build:exe
```

This runs `build:ui`, zips the result into `backend/ui-dist.zip` (via `scripts/zip-ui.ts` — a plain JS zip implementation, not the `zip` command, so this works identically on Windows), then compiles the backend with that zip embedded into a single Windows executable: `app.exe`. Double-click it, no Bun install required on the machine running it.

> **Note on `backend/ui-dist.zip`:** an empty placeholder version of this file is committed to the repo. That's intentional — the backend statically imports it (required for Bun to know what to embed into the `.exe`), so without *some* file there, even `bun run dev` would fail to start before you'd ever built the UI once. `build:exe` overwrites it with the real bundle each time you run it.

## Releasing a new version

Push a version tag:

```bash
git tag v1.1.0
git push origin v1.1.0
```

`.github/workflows/release.yml` picks this up, builds `app.exe` on GitHub's servers, renames it to `app-1.1.0.exe`, and publishes it as a GitHub release — automatically, no local Windows machine or Bun install needed to produce it. Anyone on the team can then just download the latest release and double-click it.

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

Both connect to the same alerts WebSocket automatically — no configuration needed, since it's always the same origin the page was loaded from.

## Notes on vMix

The backend calls vMix's built-in HTTP API (`http://<host>:<port>/api`), enabled by default in vMix. No plugin needed.

## Deploying for an event day

Run `app.exe` on one laptop connected to the venue Wi-Fi/LAN that the vMix machine is also on, then have commentators open `http://<that laptop's IP>:3010` from their own devices on the same network.
