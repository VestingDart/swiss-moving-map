# Swiss Inflight Display — Conceptual Prototype

A modernized, web-based moving map system for commercial aviation.
**Unsolicited conceptual prototype. Not affiliated with or endorsed by Swiss International Air Lines.**

## Views

| Route | Description |
|---|---|
| `/` | Cabin Display — passenger-facing moving map |
| `/crew` | Crew Panel — flight attendant operational view |
| `/cockpit` | Cockpit Companion — pilot EFB-companion style (demo only, not certified avionics) |
| `/control` | Dev Controller — simulation controls (start/pause/speed) |

## Tech Stack

- **Next.js 15** (App Router, TypeScript strict)
- **Tailwind CSS v4**
- **MapLibre GL JS** — 2D map rendering (open-source, no API key for core)
- **MapTiler** — tile provider (free tier, API key via env)
- **Zustand** — shared flight state store
- **Framer Motion** — animations
- **Lucide React** — icons
- **Vitest** — unit tests for pure logic

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.local.example` to `.env.local` and add your MapTiler API key (once tile integration is added).

## Directory Overview

```
app/
  (cabin)/        Cabin Display route
  crew/           Crew Panel route
  cockpit/        Cockpit Companion route
  control/        Dev Controller route
components/
  cabin/          Cabin-specific components
  crew/           Crew-specific components
  cockpit/        Cockpit-specific components
  map/            MapLibre GL wrappers (client-only)
  shared/         Components shared across views
lib/
  flight/
    types.ts      Core types (FlightState, Airport, ...)
    route.ts      Great-circle math (haversine, bearing, ...)
    phases.ts     Flight phase timeline builder
    engine.ts     Simulation engine
  airports/
    data.ts       Airport lookup by IATA code
    airports.json Airport dataset
  stores/
    flight-store.ts  Zustand store (single source of truth)
scripts/          Utility scripts (data preparation, etc.)
```

## Legal

This is an unsolicited, non-commercial conceptual prototype created for demonstration purposes only.
It is **not affiliated with, endorsed by, or sponsored by Swiss International Air Lines Ltd.**
The Cockpit Companion view is **not a certified avionics system** and is **not approved for operational flight use.**
