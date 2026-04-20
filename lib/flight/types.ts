export interface LatLng {
  lat: number;
  lng: number;
}

export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  position: LatLng;
  elevationFt: number;
}

export type FlightPhase =
  | "AT_GATE"
  | "TAXI_OUT"
  | "TAKEOFF"
  | "CLIMB"
  | "CRUISE"
  | "DESCENT"
  | "APPROACH"
  | "LANDING"
  | "TAXI_IN";

export interface FlightState {
  origin: Airport | null;
  destination: Airport | null;
  currentPosition: LatLng | null;
  altitudeFt: number;
  groundSpeedKts: number;
  phase: FlightPhase;
  progressPct: number; // 0–100
  etaUnix: number | null; // Unix timestamp (seconds)
  departedAtUnix: number | null; // Unix timestamp (seconds)
  simSpeed: number; // multiplier, e.g. 1 = real-time, 60 = 60x
}
