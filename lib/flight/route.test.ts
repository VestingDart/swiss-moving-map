import { describe, it, expect } from "vitest";
import { haversineKm } from "./route";
import type { LatLng } from "./types";

// Reference airport coordinates (decimal degrees).
const ZRH: LatLng = { lat: 47.4647, lng: 8.5492 };
const LHR: LatLng = { lat: 51.4700, lng: -0.4543 };
const JFK: LatLng = { lat: 40.6413, lng: -73.7781 };
const SIN: LatLng = { lat: 1.3644, lng: 103.9915 };

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
