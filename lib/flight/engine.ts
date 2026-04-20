import type { Airport } from "./types";

export interface FlightEngine {
  // TODO: Implement — initializes and starts a simulated flight between two airports
  start(origin: Airport, destination: Airport): void;

  // TODO: Implement — pauses the simulation (sim clock stops)
  pause(): void;

  // TODO: Implement — sets the simulation speed multiplier (1 = real-time, 60 = 60x)
  setSpeed(multiplier: number): void;

  // TODO: Implement — advances the simulation by one tick; updates the Zustand store
  tick(): void;
}

// TODO: Implement — factory that wires the engine to the flight store
export function createFlightEngine(): FlightEngine {
  throw new Error("Not implemented");
}
