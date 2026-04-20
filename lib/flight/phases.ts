import type { FlightPhase } from "./types";

export interface PhaseSegment {
  phase: FlightPhase;
  startPct: number; // 0–100
  endPct: number; // 0–100
  durationMinutes: number;
}

// TODO: Implement — builds a timeline of flight phases for a given route distance.
// Returns phase segments with progress percentages and durations.
export function buildPhaseTimeline(distanceKm: number): PhaseSegment[] {
  throw new Error("Not implemented");
}
