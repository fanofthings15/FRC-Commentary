# FRC Commentary Dashboard

A dashboard for FIRST Robotics Competition live commentary teams: stream chat, match schedule, live rankings, playoff bracket, alliances, and a way to send alerts to commentators — all in one screen.

## Requirements

- [Bun](https://bun.sh)
- Same local network as the vMix PC

## Setup

```bash
git clone https://github.com/fanofthings15/FRC-Commentary-Dashboard.git
cd FRC-Commentary-Dashboard
git config core.hooksPath .githooks
bun install
cd backend && bun install && cd ..
cd frontend && bun install && cd ..
```

## Running it (development)

```bash
bun run dev
```

Open **http://localhost:5173**.

## Running it (production-style, one process)

```bash
bun run build:ui
cd backend && bun run start
```

Open **http://localhost:3010**.

## Building the distributable .exe

```bash
bun run build:exe
```

Produces `app.exe` with the UI embedded — no Bun install needed to run it.

## Settings (in-app)

Click **Settings** and fill in:

| Field | Notes |
|---|---|
| YouTube Video ID | From your stream's URL |
| TBA API Key | thebluealliance.com/account → API Keys |
| TBA Event Key | e.g. `2026miket` |
| vMix Host / Port | IP of the vMix PC, default port `8088` |
| Telestrator URL | Optional — auto-derived from vMix host if blank |

Settings are stored encrypted on the backend, shared across devices pointed at it.

## Features

- YouTube live chat embed
- Match browser: teams, rankings, playoff bracket, alliances — all tabs
- Clickable team numbers → popup with recent event history, rank, and Winner/Finalist status
- vMix status display (read-only)
- Telestrator launcher (opens in its own window)
- Alerts panel to message commentators, with a dedicated Commentator View
