import type { Airport } from "@/lib/flight/types";
import airportsJson from "./airports.json";

// TODO: Replace with real airport data (IATA code, coordinates, elevation)
const airports: Airport[] = airportsJson as Airport[];

// TODO: Implement — looks up an airport by IATA code (e.g. "ZRH", "JFK")
export function getAirport(iata: string): Airport | undefined {
  return airports.find((a) => a.iata === iata.toUpperCase());
}
