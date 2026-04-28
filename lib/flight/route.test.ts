import { describe, it, expect } from "vitest";
import { haversineKm, initialBearing, greatCirclePoints } from "./route";
import type { LatLng } from "./types";

// Reference airport coordinates (decimal degrees).
const ZRH: LatLng = { lat: 47.4647, lng: 8.5492 };
const LHR: LatLng = { lat: 51.4700, lng: -0.4543 };
const JFK: LatLng = { lat: 40.6413, lng: -73.7781 };
const SIN: LatLng = { lat: 1.3644, lng: 103.9915 };
const CPT: LatLng = { lat: -33.97, lng: 18.60 };

describe("haversineKm", () => {
  it("ZRH → LHR is approximately 780 km", () => {
    expect(Math.abs(haversineKm(ZRH, LHR) - 780)).toBeLessThanOrEqual(10);
  });

  it("ZRH → JFK is approximately 6320 km", () => {
    expect(Math.abs(haversineKm(ZRH, JFK) - 6320)).toBeLessThanOrEqual(20);
  });

  it("ZRH → SIN is approximately 10310 km", () => {
    expect(Math.abs(haversineKm(ZRH, SIN) - 10310)).toBeLessThanOrEqual(30);
  });

  it("distance from a point to itself is 0", () => {
    expect(haversineKm(ZRH, ZRH)).toBe(0);
  });

  it("distance to the antipode is approximately half the Earth's circumference (~20015 km)", () => {
    // Antipode of ZRH: negate latitude, shift longitude by 180°.
    const antipode: LatLng = { lat: -ZRH.lat, lng: ZRH.lng - 180 };
    expect(Math.abs(haversineKm(ZRH, antipode) - 20015)).toBeLessThanOrEqual(5);
  });

  it("is symmetric: d(a, b) == d(b, a)", () => {
    expect(haversineKm(ZRH, JFK)).toBeCloseTo(haversineKm(JFK, ZRH), 6);
  });
});

describe("initialBearing", () => {
  it("ZRH → JFK heads roughly northwest (290–305°)", () => {
    const bearing = initialBearing(ZRH, JFK);
    expect(bearing).toBeGreaterThanOrEqual(285);
    expect(bearing).toBeLessThanOrEqual(310);
  });

  it("ZRH → SIN heads roughly east-southeast (80–95°)", () => {
    const bearing = initialBearing(ZRH, SIN);
    expect(bearing).toBeGreaterThanOrEqual(75);
    expect(bearing).toBeLessThanOrEqual(100);
  });

  it("ZRH → CPT heads roughly south (170–180°)", () => {
    const bearing = initialBearing(ZRH, CPT);
    expect(bearing).toBeGreaterThanOrEqual(165);
    expect(bearing).toBeLessThanOrEqual(185);
  });

  it("returns NaN for identical points (bearing is undefined)", () => {
    expect(Number.isNaN(initialBearing(ZRH, ZRH))).toBe(true);
  });
});

describe("greatCirclePoints", () => {
  it("returns the requested number of points", () => {
    expect(greatCirclePoints(ZRH, JFK, 10)).toHaveLength(10);
  });

  it("first point equals a (within 1 km)", () => {
    const pts = greatCirclePoints(ZRH, JFK, 10);
    expect(haversineKm(pts[0], ZRH)).toBeLessThan(1);
  });

  it("last point equals b (within 1 km)", () => {
    const pts = greatCirclePoints(ZRH, JFK, 10);
    expect(haversineKm(pts[9], JFK)).toBeLessThan(1);
  });

  it("midpoint lies north of the linear lat midpoint (great circle arcs poleward)", () => {
    // For a transatlantic westbound flight in the northern hemisphere, the
    // great-circle path arcs north of the rhumb line. The midpoint along
    // the great circle should therefore have a higher latitude than the
    // simple average of the endpoint latitudes.
    const pts = greatCirclePoints(ZRH, JFK, 11);
    const linearMidLat = (ZRH.lat + JFK.lat) / 2;
    expect(pts[5].lat).toBeGreaterThan(linearMidLat);
  });
});
