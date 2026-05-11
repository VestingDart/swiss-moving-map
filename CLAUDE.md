# CLAUDE.md

Project-specific instructions for Claude Code.

## Project Overview

**Swiss Inflight Display Prototype** — a modernized web-based moving map system for commercial aviation, with three zielgruppen-specific views: Cabin Display (passengers), Crew Panel (flight attendants), Cockpit Companion (pilots — EFB-companion style, NOT certified avionics).

All three views read from a single simulated flight state. No real flight data APIs.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS v4
- MapLibre GL JS (maps, open-source, no API key for core)
- MapTiler free tier for tiles (API key in env)
- Zustand (shared flight state)
- Framer Motion (animations)
- Lucide React (icons)

## Code Style

- **TypeScript strict** — no `any`, no `@ts-ignore` without a comment explaining why
- **Functional React** only, with hooks
- **Server Components by default**, Client Components only when needed (map, state, animations)
- **Tailwind** for styling — no CSS modules, no styled-components
- **File names:** kebab-case for files, PascalCase for component exports
- **Imports:** absolute paths via `@/` alias (configured in tsconfig)

## Architecture Rules

- **One source of truth** for flight state: `lib/stores/flight-store.ts` (Zustand)
- The simulation engine (`lib/flight/engine.ts`) is the ONLY thing that mutates flight state
- Views (cabin/crew/cockpit) are **read-only consumers** of the store
- Map rendering isolated in `components/map/` — other components don't touch MapLibre directly

## Important Caveats

- **Next.js version gap:** Claude's training may be behind current Next.js. Before scaffolding anything non-trivial with Next APIs, check `node_modules/next/dist/` or the official docs.
- **MapLibre vs Mapbox:** APIs are similar but NOT identical. Always reference MapLibre docs, not Mapbox.
- **No HTML `<form>` in interactive artifacts** if using the API inside artifacts later — use onClick handlers.

## What NOT To Do

- Don't add a real flight data API (OpenSky, FlightAware). The simulation is the point.
- Don't add user auth. No login. It's a kiosk/display system.
- Don't build a 3D globe. 2D map only for MVP.
- Don't use deprecated `pages/` router — App Router only.
- Don't commit `.env.local` or any API keys.
- Don't put MapLibre calls in Server Components — map is 100% client.
- **Don't build an admin dashboard.** A full admin/management UI is planned for a later phase, not MVP. For now, only the minimal `/control` dev-controller exists (used during development to start/stop the simulation).

## Cockpit View — Legal / Safety Rule

The Cockpit Companion view is a **demonstration prototype only**. It is **NOT** a certified avionics system. Every page under `/cockpit` MUST render a persistent, visible disclaimer:

> "Demonstration prototype. Not a certified avionics system. Not approved for operational flight use."

This is non-negotiable for the project's credibility and legal safety.

## Swiss Branding

This project is an **unsolicited conceptual prototype**. It is **not affiliated with or endorsed by Swiss International Air Lines**. Every user-facing page should have this disclaimer in the footer or about section. Don't overclaim.

## Testing

- Unit tests for pure logic: `lib/flight/route.ts`, `lib/flight/phases.ts` — use Vitest
- No component tests for MVP (time investment not worth it for a prototype)
- Manual testing via the `/control` dev route

## Commit Style

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- German or English OK in commit messages (project owner is German-speaking)

## When Stuck

If a task is ambiguous or would require significant guessing, **stop and ask** — don't scaffold 500 lines of speculative code.
