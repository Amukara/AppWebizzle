// Google Maps helpers: vendor coordinates + rider position interpolation.
// Vendor coords are kept here (not in the DB) for the 6 seeded vendors so the
// tracking map can plot pickup → dropoff without a schema migration on Vendor.

export type LatLng = { lat: number; lng: number };

// Approximate coordinates for the 6 seeded neighbourhood vendors.
// (Nairobi area: Kileleshwa, Westlands, Kilimani.)
const VENDOR_COORDS: Record<string, LatLng> = {
  v1: { lat: -1.2676, lng: 36.8108 }, // Baraka General Store — Kileleshwa, Njiwa Rd
  v2: { lat: -1.2649, lng: 36.8076 }, // Mama Wanjiru Mboga — Kileleshwa Market
  v3: { lat: -1.2641, lng: 36.8054 }, // Quickmart Duka — Westlands, Ring Rd
  v4: { lat: -1.2691, lng: 36.8123 }, // City Pharmacy — Kileleshwa, Makini Rd
  v5: { lat: -1.2762, lng: 36.7833 }, // Hotspot Bakery — Kilimani, Argwings Rd
  v6: { lat: -1.2803, lng: 36.7905 }, // Tuskys Express — Kilimani, Yaya Ct
};

export function vendorCoords(vendorId: string): LatLng | null {
  return VENDOR_COORDS[vendorId] ?? null;
}

// Default map centre (Kileleshwa) used when no coords are available.
export const DEFAULT_CENTER: LatLng = { lat: -1.2676, lng: 36.8108 };

// Linear interpolation between two coords at fraction t (0..1).
export function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    lat: a.lat + (b.lat - a.lat) * clamped,
    lng: a.lng + (b.lng - a.lng) * clamped,
  };
}

// Rider position: along the vendor→customer line at progressPct/100, with a
// tiny deterministic jitter so the pin looks alive on the live map.
export function riderPosition(
  from: LatLng,
  to: LatLng,
  progressPct: number
): LatLng {
  const base = interpolate(from, to, progressPct / 100);
  // Small jitter derived from the current time so it drifts subtly.
  const jitter = 0.0004;
  const seed = Math.sin(Date.now() / 9000) * jitter;
  return { lat: base.lat + seed, lng: base.lng + seed * 0.7 };
}

// Straight-line distance in km between two coords (haversine, simplified).
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)) * 10) / 10;
}
