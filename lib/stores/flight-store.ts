import { create } from "zustand";
import type { FlightState } from "@/lib/flight/types";

interface FlightStore extends FlightState {
  // TODO: Implement — replaces the entire flight state (called by the engine on each tick)
  setFlightState: (state: Partial<FlightState>) => void;

  // TODO: Implement — resets to initial idle state
  reset: () => void;
}

const initialState: FlightState = {
  origin: null,
  destination: null,
  currentPosition: null,
  altitudeFt: 0,
  groundSpeedKts: 0,
  phase: "AT_GATE",
  progressPct: 0,
  etaUnix: null,
  departedAtUnix: null,
  simSpeed: 60,
};

export const useFlightStore = create<FlightStore>((set) => ({
  ...initialState,

  // TODO: Implement — merge partial updates into store
  setFlightState: (_state: Partial<FlightState>) => {
    throw new Error("Not implemented");
  },

  // TODO: Implement
  reset: () => {
    throw new Error("Not implemented");
  },
}));
