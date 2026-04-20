import type { LatLng } from "./types";

// TODO: Implement — returns the great-circle distance in km between two points
export function haversineKm(a: LatLng, b: LatLng): number {
  throw new Error("Not implemented");
}

// TODO: Implement — returns the initial bearing (degrees, 0–360) from a to b
export function initialBearing(a: LatLng, b: LatLng): number {
  throw new Error("Not implemented");
}

// TODO: Implement — returns n evenly-spaced points along the great circle from a to b
export function greatCirclePoints(a: LatLng, b: LatLng, n: number): LatLng[] {
  throw new Error("Not implemented");
}

// TODO: Implement — rough estimate of total flight time in minutes for a given distance
export function estimateFlightTimeMinutes(distanceKm: number): number {
  throw new Error("Not implemented");
}

// TODO: Implement — returns a typical cruise altitude in feet for a given route distance
export function cruiseAltitudeForDistance(distanceKm: number): number {
  throw new Error("Not implemented");
}
