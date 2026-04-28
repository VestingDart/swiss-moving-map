import type { LatLng } from "./types";

// Mean Earth radius in km (IUGG R1 ≈ 6371.0088 km, rounded).
// The Earth is an oblate spheroid, but for a moving-map display ~0.5% error
// is well within tolerance — this is UI, not navigation.
const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

// Great-circle distance in km between two points using the Haversine formula.
//
// The Haversine formula computes the length of the shortest arc on a sphere
// (a "great circle") between two lat/lng points. Plain Pythagoras would be
// wrong because lines of longitude converge at the poles — 1° of longitude
// at the equator is ~111 km, but only ~78 km at 45° latitude.
export function haversineKm(a: LatLng, b: LatLng): number {
  // Convert everything to radians once.
  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const dPhi = toRad(b.lat - a.lat);
  const dLambda = toRad(b.lng - a.lng);

  // h = sin²(Δφ/2) + cos(φ₁)·cos(φ₂)·sin²(Δλ/2)
  // This is half the squared chord length between the two points on the unit sphere.
  // The cos(φ₁)·cos(φ₂) factor scales the longitude term so that meridians
  // converging at the poles are handled correctly.
  const h =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;

  // Convert h back to a central angle (in radians).
  // atan2(√h, √(1−h)) is preferred over asin(√h) because it stays numerically
  // stable for nearly-antipodal points (where h approaches 1).
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  // Arc length = radius × angle (in radians).
  return EARTH_RADIUS_KM * c;
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
