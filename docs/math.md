# Math Reference — Engine Geometry

How `lib/flight/route.ts` actually works, and why every formula looks the way it does.

This is not a textbook. It's a record of the design decisions: why we chose Haversine over alternatives, why `atan2` instead of `atan`, why `NaN` instead of `0` for an undefined bearing, and what a great circle actually looks like on a flat map.

---

## 1. Introduction

### Why a moving map needs math

Every frame on the cabin display answers three questions:

1. **How far apart are origin and destination?** → distance
2. **Which way is the plane pointing right now?** → bearing
3. **Where exactly do I draw the route line on the map?** → points along the route

Three questions, three formulas — and all three operate on a sphere. None of them work if you forget that. Most "obvious" formulas (Pythagoras, linear interpolation, plain `atan`) silently forget it and produce results that look right at small scales and lie at large ones.

The three formulas implemented in `lib/flight/route.ts`:

| Function | Formula | Section |
|---|---|---|
| `haversineKm` | Haversine | §2 |
| `initialBearing` | Forward azimuth via `atan2` | §3 |
| `greatCirclePoints` | Slerp (Spherical Linear Interpolation) | §4 |

---

## 2. Haversine — distance on a sphere

### Why Pythagoras isn't good enough

The naive idea: treat lat/lng as `(x, y)` and use `√(Δx² + Δy²)`. This works on a flat plane. On a sphere it doesn't, because **lines of longitude converge at the poles**:

```
                  N pole
                    *
                   /|\
                  / | \
                 /  |  \         ← longitude lines bunch together
                /   |   \
               /    |    \
              /     |     \
        *----+------+------+----*    60°N: 1° lng = ~56 km
        |    |      |      |    |
        *----+------+------+----*    equator: 1° lng = ~111 km
```

At the equator, 1° of longitude is about 111 km. At 60° latitude, the same 1° is only about 56 km — half the distance. Pythagoras has no way to know this. Haversine does.

### The formula

For two points `(φ₁, λ₁)` and `(φ₂, λ₂)`, where φ is latitude and λ is longitude (both in radians):

```
h = sin²(Δφ/2) + cos(φ₁)·cos(φ₂)·sin²(Δλ/2)
c = 2·atan2(√h, √(1−h))
d = R·c
```

Step by step:

| Step | What it does |
|---|---|
| `sin²(Δφ/2)` | The latitude part. Equivalent to a Pythagoras-style north-south term, but expressed as a half-angle so it composes cleanly with the longitude term. |
| `cos(φ₁)·cos(φ₂)·sin²(Δλ/2)` | The longitude part, scaled by `cos(φ₁)·cos(φ₂)`. This is the magic factor — it shrinks the contribution of longitude differences as you move toward the poles, exactly accounting for the convergence shown above. |
| `h` | A dimensionless intermediate. Geometrically: half the squared chord length between the two points on a unit sphere. |
| `2·atan2(√h, √(1−h))` | Recovers the central angle `c` (in radians) — the angle subtended at the centre of the Earth by the arc from A to B. |
| `R·c` | Arc length = radius × angle. We get kilometres back out. |

### Why `atan2`, not `asin`

A textbook variant uses `c = 2·asin(√h)`. Mathematically equivalent for sane inputs, but **numerically unstable** when the two points are nearly antipodal: `h` approaches 1, `√h` approaches 1, and `asin(1)` sits at the edge of its domain where small floating-point errors blow up. `atan2(√h, √(1−h))` stays well-behaved across the whole sphere, including the antipode case. There's no downside, so we use it everywhere.

### Earth radius: 6371 km

The Earth is not a sphere. It's an oblate spheroid — squished at the poles by about 21 km. Different reference radii exist:

| Source | Value | Use |
|---|---|---|
| Equatorial radius | 6378.137 km | GPS/WGS84 |
| Polar radius | 6356.752 km | GPS/WGS84 |
| **IUGG mean radius R₁** | **6371.0088 km** | Geodesy |
| Authalic radius (equal-area sphere) | 6371.0072 km | Map projections |

We use **6371 km**, the rounded IUGG mean. The error vs. the "true" geodesic distance on the WGS84 ellipsoid is **~0.5 % worst-case**. For a moving-map UI this is invisible — the route line on screen would not shift by a single pixel. We are not navigating; we are decorating. If we ever needed centimetre-grade accuracy, we'd use Vincenty's formula on the ellipsoid, not Haversine on a sphere.

### Why radians, not degrees

JavaScript's `Math.sin`, `Math.cos`, and friends all expect radians. So do almost all math libraries in almost all languages — radians come from calculus (`d/dx sin(x) = cos(x)` only when `x` is in radians). Lat/lng come in as degrees because that's how humans read maps. Convert once at the top of the function, work in radians throughout, never mix.

```ts
const toRad = (deg: number): number => (deg * Math.PI) / 180;
```

### Sanity-bench: actual values

Routes computed by our implementation (rounded to 2 decimals):

| Route | Computed | Reference | Δ |
|---|---|---|---|
| ZRH → LHR | 787.58 km | ~780 km (atlas) | +7.58 km |
| ZRH → JFK | 6309.32 km | ~6320 km | −10.68 km |
| ZRH → SIN | 10304.25 km | ~10310 km | −5.75 km |
| ZRH → CPT | 9110.53 km | ~9100 km | +10.53 km |
| ZRH → antipode | 20015.09 km | π·R = 20015.09 km | 0.00 km |

The antipode case is a built-in sanity check — half the Earth's circumference along any great circle equals exactly `π · 6371 ≈ 20015.09 km`. Hitting it dead-on confirms the formula and the radius constant agree.

### Edge cases

| Input | Result | Why |
|---|---|---|
| `haversineKm(p, p)` | `0` | Δφ = Δλ = 0 → h = 0 → c = 0 → d = 0. Falls out of the formula naturally, no special-case needed. |
| Antipodes | `~20015.09 km` | `atan2` handles `h ≈ 1` cleanly, unlike `asin`. |
| Negative lat/lng | Works as-is | All trig functions are happy with negative angles in radians. |

### Code

```ts
// lib/flight/route.ts
const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number): number => (deg * Math.PI) / 180;

export function haversineKm(a: LatLng, b: LatLng): number {
  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const dPhi = toRad(b.lat - a.lat);
  const dLambda = toRad(b.lng - a.lng);

  const h =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}
```

---

## 3. Initial Bearing — compass heading

### Why "initial"

Take a globe, draw a great-circle arc from Zürich to New York, and follow it with your finger. Your finger starts pointing roughly **northwest** (bearing ~296°). Halfway across the Atlantic, near southern Greenland, your finger points roughly **west** (~270°). By the time you reach JFK, you're pointing almost **southwest** (~245°).

The bearing changes continuously along the route. There is no single "the bearing of this flight." We pick the **initial bearing** — the heading at the start — because that's what the cockpit and the moving map need at any given moment: "which way am I pointing right now, given my current position and the destination?"

The only routes where the bearing stays constant are:
- **Along the equator** (always exactly east or west)
- **Along a meridian** (always exactly north or south)

Every other flight is a curve when you watch the heading.

There is a different kind of route — the **rhumb line** (or loxodrome) — where the bearing is constant by construction. Pilots used these in the age of magnetic compasses because they were easier to fly. Rhumb lines are longer than great circles, and visibly so on long-haul: the great-circle route ZRH → JFK passes near Iceland; the rhumb line takes you straight across at ~44°N, several hundred kilometres further.

### The formula

```
y = sin(Δλ)·cos(φ₂)
x = cos(φ₁)·sin(φ₂) − sin(φ₁)·cos(φ₂)·cos(Δλ)
θ = atan2(y, x)
```

Then convert `θ` from radians `(−π, π]` to degrees, and shift to compass range `[0, 360)`:

```ts
const bearingDeg = (θ * 180 / Math.PI + 360) % 360;
```

You can think of `y` as the "east-west pull" of the destination relative to the origin (positive y = east), and `x` as the "north-south pull" (positive x = roughly north, accounting for latitude curvature). `atan2(y, x)` turns those two pulls into a single compass angle.

### Why `atan2`, not `atan`

`atan(y/x)` collapses a 2D direction into a single ratio, losing the sign information. It can't distinguish:

- 45° (NE) from 225° (SW) — both have `y/x = 1`
- 135° (SE) from 315° (NW) — both have `y/x = −1`

`atan2(y, x)` takes `y` and `x` separately, sees their signs, and returns the correct quadrant. Every quadrant of the compass is unambiguous. This isn't a corner-case detail — it's the difference between "your aircraft is pointing northeast" and "your aircraft is pointing southwest." Always use `atan2` for direction-from-coordinates.

### The 0–360 compass scale

| Degrees | Direction |
|---|---|
| 0° | North |
| 90° | East |
| 180° | South |
| 270° | West |
| 360° = 0° | (wraps) |

This is the convention used in aviation and navigation. Mathematicians sometimes use the opposite convention (counter-clockwise from east), but compass north-up is universal in cockpits, so we use it throughout.

### Edge case: bearing of a point to itself

When `a === b`, both `x` and `y` are exactly zero. JavaScript's `Math.atan2(0, 0)` returns `0`. That would mean "true north" — but there's no direction at all when you haven't moved.

We had three options:

| Choice | Trade-off |
|---|---|
| Return `0` | Silent and pragmatic. Crash-free. But **lies** about direction — an aircraft sitting at the gate would suddenly point north. |
| Return `NaN` | Honest. Propagates through arithmetic so any downstream calculation that uses it becomes `NaN` and fails fast in tests. Callers can detect with `Number.isNaN()`. |
| `throw` | Maximally loud. But aggressive for a UI: if the simulation briefly evaluates `bearing(pos, pos)` while the aircraft is parked, the entire renderer crashes. |

**We chose `NaN`.** Rationale: in a moving-map context, the most likely caller of `bearing(a, a)` is a render loop pulling the current position and the destination at a moment when they happen to coincide (taxiing onto the gate, simulator at idle). Crashing is too harsh. Returning `0` silently shows a wrong arrow on screen, which is worse than no arrow. `NaN` lets the consumer say `if (Number.isNaN(b)) showLastValid()` cleanly.

### Sanity-bench: actual values

| Route | Computed | Expected direction |
|---|---|---|
| ZRH → JFK | 295.93° | West-northwest (transatlantic westbound) |
| ZRH → SIN | 85.06° | Almost due east (great circle goes high north over Russia) |
| ZRH → CPT | 171.59° | Just east of due south |
| ZRH → LHR | 307.76° | Northwest |

Notice ZRH → SIN: Singapore is far to the south of Zürich (1°N vs. 47°N), so naïvely you'd expect a southeast bearing (~120°). But the great circle from Zürich to Singapore arcs north over Russia and Kazakhstan before bending south — the **initial** heading is almost due east. This is the great-circle effect at work: the shortest path between two points on a sphere is rarely the path that "looks" straight on a Mercator map.

### Code

```ts
export function initialBearing(a: LatLng, b: LatLng): number {
  if (a.lat === b.lat && a.lng === b.lng) return NaN;

  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const dLambda = toRad(b.lng - a.lng);

  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);

  const bearingRad = Math.atan2(y, x);
  return ((bearingRad * 180) / Math.PI + 360) % 360;
}
```

---

## 4. Great Circle Points — Slerp

### What we need

To draw the route on the map, we need a polyline — an array of points that, connected with line segments, looks smooth and follows the actual great-circle path. For a Zürich → New York leg with 100 segments, we want 100 points, evenly distributed along the arc.

### Why linear lat/lng interpolation is wrong

The "obvious" approach: midpoint = ((lat₁+lat₂)/2, (lng₁+lng₂)/2). Repeat at each fraction. This produces a line that's straight in lat/lng space — which on a Mercator-projection map looks like a straight line, but on the actual sphere is a **rhumb line**, not a great circle.

The two diverge dramatically on long-haul:

```
                         great circle ZRH→JFK
                        ↓
     ZRH ___                                ___ JFK
            \___                       ___/
                \___               ___/        ← arcs through ~52°N
                    \___       ___/
                        \_____/
                        
     ZRH ----------- linear lat/lng line ---------- JFK
                                                    ↑ stays at ~44°N
```

For ZRH (47.46°N, 8.55°E) → JFK (40.64°N, −73.78°W):

| Method | Midpoint latitude |
|---|---|
| Linear lat average | **44.05°N** |
| **Great-circle midpoint (Slerp)** | **52.08°N** |

That's an 8-degree difference in latitude — about **890 km** further north. On a real map, the great-circle route hugs southern Greenland and Iceland; the linear interpolation cuts straight across the open Atlantic. Drawing the wrong line is a visible cosmetic bug *and* a misrepresentation of how aircraft actually fly.

### What Slerp is

**Slerp = Spherical Linear Interpolation.** Given two points on a sphere and a fraction `f ∈ [0, 1]`, Slerp returns the point that lies a fraction `f` of the way along the **arc** between them — not along the chord that would tunnel through the sphere.

The trick: instead of interpolating **positions** linearly, interpolate the **angle** linearly. Going from `f = 0` to `f = 1` sweeps the full central angle `δ` from start to finish, with intermediate points sitting on the great circle by construction.

### The formula

For two points represented as 3D unit vectors `P` and `Q` on a sphere, separated by central angle `δ`:

```
Slerp(P, Q, f) = (sin((1−f)·δ) / sin(δ)) · P + (sin(f·δ) / sin(δ)) · Q
```

The two coefficients `A = sin((1−f)·δ) / sin(δ)` and `B = sin(f·δ) / sin(δ)` are sine-weighted, not linear. Sine-weighting is what keeps the result on the sphere — a plain linear blend `(1−f)·P + f·Q` gives a point inside the sphere, slightly closer to the centre than the surface.

For implementation we:
1. Convert each lat/lng endpoint to 3D Cartesian on the unit sphere.
2. Compute the central angle `δ` (same expression as inside Haversine, without the radius factor).
3. For each fraction `f`, compute `A` and `B`, blend the two 3D vectors, and convert back to lat/lng.

Edge cases:
- **`δ = 0`** (identical points): `sin(δ) = 0`, the formula divides by zero. We special-case this and return `n` copies of the start point.
- **`δ = π`** (exact antipodes): `sin(π) = 0`, same problem, but mathematically there are infinitely many great circles between antipodes. Real flights never go between antipodes, so we don't special-case this — if you somehow hit it, you'll get `NaN`s and a fast-failing test.

### Endpoints are exact

At `f = 0`: `A = sin(δ)/sin(δ) = 1`, `B = 0`. The blend is exactly `P`, which converts back to exactly `(φ₁, λ₁)`.
At `f = 1`: `A = 0`, `B = 1`. The blend is exactly `Q`, which converts back to exactly `(φ₂, λ₂)`.

In practice floating-point introduces sub-millimetre noise, but the test tolerance of 1 km is over six orders of magnitude looser than the actual error. The first and last points are, for any practical purpose, exactly `a` and `b`.

### Application: drawing route polylines

For the cabin map's flown/remaining route lines, we sample the great circle with `n = 100` points and feed the result to MapLibre as a `LineString` GeoJSON feature. 100 points is overkill for accuracy but cheap, and gives a perfectly smooth curve at any zoom level we care about.

```ts
const arc = greatCirclePoints(origin.position, destination.position, 100);
const lineString = {
  type: "LineString",
  coordinates: arc.map(p => [p.lng, p.lat]),  // GeoJSON wants [lng, lat]
};
```

Note the lng/lat order in GeoJSON — that catches everyone the first time.

### Code

```ts
export function greatCirclePoints(a: LatLng, b: LatLng, n: number): LatLng[] {
  if (n <= 0) return [];
  if (n === 1) return [{ lat: a.lat, lng: a.lng }];

  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const lambda1 = toRad(a.lng);
  const lambda2 = toRad(b.lng);

  const h =
    Math.sin((phi2 - phi1) / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin((lambda2 - lambda1) / 2) ** 2;
  const delta = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  if (delta === 0) {
    return Array.from({ length: n }, () => ({ lat: a.lat, lng: a.lng }));
  }

  const sinDelta = Math.sin(delta);
  const result: LatLng[] = [];

  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const A = Math.sin((1 - f) * delta) / sinDelta;
    const B = Math.sin(f * delta) / sinDelta;

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
```

---

## 5. Sanity-bench: actual numbers

All values produced by the current implementation, taken directly from a run.

### Distances

| Route | Computed | Reference (atlas / great-circle calc) | Δ | Test tolerance |
|---|---|---|---|---|
| ZRH → LHR | 787.58 km | ~780 km | +7.58 km | ±10 km |
| ZRH → JFK | 6309.32 km | ~6320 km | −10.68 km | ±20 km |
| ZRH → SIN | 10304.25 km | ~10310 km | −5.75 km | ±30 km |
| ZRH → CPT | 9110.53 km | ~9100 km | +10.53 km | (no test yet) |
| ZRH → antipode | 20015.09 km | π·R = 20015.09 km | 0.00 km | ±5 km |

### Bearings

| Route | Computed | Test range | Direction |
|---|---|---|---|
| ZRH → JFK | 295.93° | 285–310° | NW (transatlantic) |
| ZRH → SIN | 85.06° | 75–100° | almost due east (over Russia) |
| ZRH → CPT | 171.59° | 165–185° | just east of due south |

### Slerp midpoint comparison

| Method | Midpoint of ZRH → JFK |
|---|---|
| Linear lat/lng average | (44.05°N, −32.61°W) |
| Slerp (true great circle) | (52.08°N, −35.50°W) |
| Difference | ~890 km north |

### Why we use tolerances, not exact matches

Three sources of "noise" make exact matches inappropriate:

1. **Atlas reference values are rounded.** Sources publishing "ZRH → JFK = 6320 km" usually don't say which radius, which formula, or which airport coordinates they used. A few km of disagreement between sources is normal.
2. **The Earth is not a sphere.** Our 6371 km mean radius is off by ~21 km between the equator and the poles. Real great-circle distance on the WGS84 ellipsoid (computed via Vincenty) differs from our spherical Haversine by up to ~0.5 %. For ZRH → JFK that's ~30 km.
3. **Airport coordinates vary.** "ZRH" can mean the geographic center of the airport, the runway midpoint, the terminal, or the airport reference point (ARP). Different datasets choose differently. Our coordinates are the airport reference points, accurate to ~100 m.

The test tolerances (±10 km for short-haul, ±30 km for long-haul) are calibrated against these real-world variances. Tighter tolerances would catch implementation bugs but fail on legitimate disagreement between data sources.

---

## 6. What's next

Two functions in `route.ts` are still TODO stubs:

### `estimateFlightTimeMinutes(distanceKm)`

Rough estimate of flight duration from route distance. **Not just `distance / cruise_speed`** — short hops are dominated by climb/descent (high-fuel-burn, low-speed phases), while long hauls are dominated by cruise. A 200 km hop and a 12000 km haul have very different effective speeds.

This is a **design decision**, not pure math: which idealised speed profile do we use? Block time vs. air time? Wind? We'll work this out in a separate session.

### `cruiseAltitudeForDistance(distanceKm)`

Typical cruise altitude as a function of route distance. Short flights (under ~500 km) often cruise around FL280–FL320. Long hauls climb stepwise to FL380–FL410 over the course of the flight as fuel burns off.

Also a **design decision**: do we model step climbs, or just pick a representative altitude per distance bucket? The simulation needs *something* plausible — what level of plausibility is enough?

These two are deferred to their own session because they're not really math — they're modelling choices about how realistic vs. how simple to be. Worth thinking about explicitly rather than scaffolding values that look reasonable but aren't grounded.
