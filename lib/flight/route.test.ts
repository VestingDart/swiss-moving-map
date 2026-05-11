import { describe, it, expect } from "vitest";
import { haversineKm, initialBearing, greatCirclePoints, cruiseAltitudeForDistance } from "./route";
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

describe("cruiseAltitudeForDistance", () => {
  // Representative real-world routes
  it("ZRH → MUC (280 km) → FL240", () => {
    expect(cruiseAltitudeForDistance(280)).toBe(24000);
  });

  it("ZRH → LHR (780 km) → FL330", () => {
    expect(cruiseAltitudeForDistance(780)).toBe(33000);
  });

  it("longer European route (2200 km) → FL370", () => {
    expect(cruiseAltitudeForDistance(2200)).toBe(37000);
  });

  it("ZRH → JFK (6320 km) → FL380", () => {
    expect(cruiseAltitudeForDistance(6320)).toBe(38000);
  });

  it("ZRH → SIN (10310 km) → FL400", () => {
    expect(cruiseAltitudeForDistance(10310)).toBe(40000);
  });

  // Boundary tests — verify the exact threshold values
  it("299 km (just below 300 threshold) → FL240", () => {
    expect(cruiseAltitudeForDistance(299)).toBe(24000);
  });

  it("300 km (first threshold) → FL330", () => {
    expect(cruiseAltitudeForDistance(300)).toBe(33000);
  });

  it("7999 km (just below 8000 threshold) → FL380", () => {
    expect(cruiseAltitudeForDistance(7999)).toBe(38000);
  });

  it("8000 km (last threshold) → FL400", () => {
    expect(cruiseAltitudeForDistance(8000)).toBe(40000);
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
