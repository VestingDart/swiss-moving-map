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

// Initial bearing (forward azimuth) in degrees [0, 360), where 0 = North, 90 = East.
//
// "Initial" because along a great circle the bearing changes continuously
// (except along the equator or along meridians). This is the heading you'd
// turn to AT THE START of the flight.
//
// Edge cases:
//   - Identical points: bearing is undefined → returns NaN.
//   - Antipodes: any direction is technically valid; this returns one of them.
//   - Points exactly at a pole: result is mathematically defined but degenerate.
export function initialBearing(a: LatLng, b: LatLng): number {
  // Identical points have no defined direction. Return NaN so callers must
  // explicitly handle the case (vs. silently returning 0 = "North").
  if (a.lat === b.lat && a.lng === b.lng) return NaN;

  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const dLambda = toRad(b.lng - a.lng);

  // Decompose into "east-west pull" (y) and "north-south pull" (x).
  // We use atan2(y, x) — not atan(y/x) — because atan2 knows the quadrant
  // from the signs of y and x, so it gives correct bearings in all directions.
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);

  // atan2 returns radians in (−π, π]. Convert to degrees, then shift to
  // compass range [0, 360) by adding 360 before the modulo (atan2 can be negative).
  const bearingRad = Math.atan2(y, x);
  return ((bearingRad * 180) / Math.PI + 360) % 360;
}

// Returns n evenly-spaced points along the great-circle path from a to b.
// First element ≈ a, last element ≈ b (exact up to floating-point precision).
//
// Implemented via Slerp (Spherical Linear Interpolation): for each fraction
// f ∈ [0, 1] along the arc, we compute the point that lies that fraction of
// the central angle δ between a and b on the unit sphere.
export function greatCirclePoints(a: LatLng, b: LatLng, n: number): LatLng[] {
  if (n <= 0) return [];
  if (n === 1) return [{ lat: a.lat, lng: a.lng }];

  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const lambda1 = toRad(a.lng);
  const lambda2 = toRad(b.lng);

  // Central angle δ between a and b (in radians).
  // Same expression as inside haversineKm — without the Earth radius factor.
  const h =
    Math.sin((phi2 - phi1) / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin((lambda2 - lambda1) / 2) ** 2;
  const delta = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  // Degenerate case: a and b are the same point. The Slerp formula divides
  // by sin(δ) which would be 0 here. Return n copies of the start point.
  if (delta === 0) {
    return Array.from({ length: n }, () => ({ lat: a.lat, lng: a.lng }));
  }

  const sinDelta = Math.sin(delta);
  const result: LatLng[] = [];

  for (let i = 0; i < n; i++) {
    // f = 0 at i=0 → point a; f = 1 at i=n-1 → point b.
    const f = i / (n - 1);

    // Slerp weights: as f sweeps 0→1, weight A shifts from 1→0 and B from 0→1,
    // but along the arc (sine-weighted), not linearly through the Earth.
    const A = Math.sin((1 - f) * delta) / sinDelta;
    const B = Math.sin(f * delta) / sinDelta;

    // Convert each endpoint to 3D Cartesian on the unit sphere, blend, then
    // convert the blended vector back to lat/lng. The blend stays on the
    // sphere because A and B are sine-weighted.
    const x =
      A * Math.cos(phi1) * Math.cos(lambda1) +
      B * Math.cos(phi2) * Math.cos(lambda2);
    const y =
      A * Math.cos(phi1) * Math.sin(lambda1) +
      B * Math.cos(phi2) * Math.sin(lambda2);
    const z = A * Math.sin(phi1) + B * Math.sin(phi2);

    const lat = (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI;
    const lng = (Math.atan2(y, x) * 180) / Math.PI;

    result.push({ lat, lng });
  }

  return result;
}

// TODO: Implement — rough estimate of total flight time in minutes for a given distance
export function estimateFlightTimeMinutes(distanceKm: number): number {
  throw new Error("Not implemented");
}

/**
 * Returns a representative cruise altitude in feet for a given route distance.
 *
 * **What are Flight Levels?**
 * In commercial aviation, altitude above roughly 18,000 ft is expressed as a
 * Flight Level (FL): FL240 = 24,000 ft barometric pressure altitude, FL370 =
 * 37,000 ft, etc. These are barometric altitudes referenced to the standard
 * ISA pressure (1013.25 hPa), not geometric height above sea level.
 *
 * **Why we simplify here**
 * Real cruise altitude is determined by the Flight Management System and ATC,
 * and depends on many factors we deliberately don't model:
 *   - Aircraft type and MTOW (a B737 tops out lower than an A380)
 *   - Current weight / fuel load (lighter aircraft cruise higher)
 *   - Wind aloft (pilots request different levels to find tailwinds)
 *   - Step climbs (on ultra-long hauls, aircraft climb mid-flight as fuel burns off)
 *   - ATC traffic and airspace restrictions
 *
 * We have none of those inputs — only route distance — so we use a five-bucket
 * lookup that captures the broad real-world pattern: very short hops rarely
 * reach high altitudes, long-haul flights cruise at the top of the envelope.
 *
 * **Accuracy**
 * This is a coarse approximation for visualization purposes only.
 * See `docs/math.md §5` for the full rationale and the real-world factors
 * that drive the actual numbers.
 *
 * @param distanceKm  Great-circle route distance in kilometres.
 * @returns           Cruise altitude in feet (one of five discrete values).
 */
export function cruiseAltitudeForDistance(distanceKm: number): number {
  if (distanceKm < 300) return 24000;   // FL240 — very short, barely any cruise phase
  if (distanceKm < 800) return 33000;   // FL330 — typical intra-European short-haul
  if (distanceKm < 2500) return 37000;  // FL370 — longer European / North Africa
  if (distanceKm < 8000) return 38000;  // FL380 — intercontinental
  return 40000;                          // FL400 — ultra-long-haul
}
