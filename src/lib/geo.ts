export type GeoPoint = {
  lat: number;
  lng: number;
};

export type RadiusStep = {
  km: number | null;
  label: string;
};

export const RADIUS_STEPS: readonly RadiusStep[] = [
  { km: 2, label: "2 km" },
  { km: 5, label: "5 km" },
  { km: 15, label: "15 km" },
  { km: 30, label: "30 km" },
  { km: null, label: "All UAE" },
];

/**
 * Demonstration pins for Dubai neighborhoods — not live seller GPS.
 */
export const AREA_COORDS: Record<string, GeoPoint> = {
  "Dubai Marina": { lat: 25.0805, lng: 55.1403 },
  JLT: { lat: 25.0693, lng: 55.1417 },
  "JLT Cluster X": { lat: 25.072, lng: 55.145 },
  "Downtown Dubai": { lat: 25.1972, lng: 55.2744 },
  Downtown: { lat: 25.1972, lng: 55.2744 },
  "Palm Jumeirah": { lat: 25.1124, lng: 55.139 },
  Jumeirah: { lat: 25.206, lng: 55.248 },
  "Jumeirah 2": { lat: 25.198, lng: 55.246 },
  "Al Barsha": { lat: 25.111, lng: 55.1985 },
  "Al Quoz": { lat: 25.138, lng: 55.228 },
  JVC: { lat: 25.0556, lng: 55.2117 },
  DIFC: { lat: 25.21, lng: 55.28 },
};

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function normalizePlace(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function coordsForPlace(place: string): GeoPoint | null {
  const exact = AREA_COORDS[place];
  if (exact) return exact;
  const needle = normalizePlace(place);
  const match = Object.entries(AREA_COORDS).find(
    ([name]) => normalizePlace(name) === needle,
  );
  return match ? match[1] : null;
}

/** Great-circle distance in kilometers between two WGS84 coordinates. */
export function haversineKm(from: GeoPoint, to: GeoPoint): number {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * sinLng * sinLng;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatKmAway(km: number): string {
  if (km < 0.15) return "Near you";
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

export function listingProximityLabel(
  location: string,
  point: GeoPoint,
  origin: GeoPoint | null,
): string {
  if (!origin) return location;
  return `${location} • ${formatKmAway(haversineKm(origin, point))}`;
}

export function withinRadius(
  origin: GeoPoint,
  point: GeoPoint,
  radiusKm: number | null,
): boolean {
  if (radiusKm == null) return true;
  return haversineKm(origin, point) <= radiusKm;
}

export function radiusStepIndex(radiusKm: number | null): number {
  const index = RADIUS_STEPS.findIndex((step) => step.km === radiusKm);
  return index === -1 ? RADIUS_STEPS.length - 1 : index;
}

export function requestBrowserPosition(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new DOMException("Geolocation is unavailable.", "NotSupportedError"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60_000,
      },
    );
  });
}
