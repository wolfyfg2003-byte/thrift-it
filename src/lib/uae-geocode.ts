import { AREA_COORDS, type GeoPoint } from "@/lib/geo";
import type { Emirate } from "@/lib/uae-address";

export type GeocodeHit = {
  id: string;
  label: string;
  building: string;
  emirate: Emirate;
  community: string;
  street: string;
  unitHint: string;
  lat: number;
  lng: number;
};

const POINT = (place: string, nudge: GeoPoint): GeoPoint => {
  const base = AREA_COORDS[place] ?? { lat: 25.2048, lng: 55.2708 };
  return { lat: base.lat + nudge.lat, lng: base.lng + nudge.lng };
};

/**
 * Demonstration UAE residential pins — not live Mapbox/Google Places.
 * Returns realistic tower/villa coordinates as the buyer types.
 */
export const UAE_GEOCODE_INDEX: readonly GeocodeHit[] = [
  {
    id: "marina-gate-1",
    label: "Marina Gate 1, Dubai Marina",
    building: "Marina Gate 1",
    emirate: "Dubai",
    community: "Dubai Marina",
    street: "Al Thanyah Street",
    unitHint: "2408",
    ...POINT("Dubai Marina", { lat: 0.0012, lng: -0.0006 }),
  },
  {
    id: "marina-promenade",
    label: "Marina Promenade, Dubai Marina",
    building: "Marina Promenade",
    emirate: "Dubai",
    community: "Dubai Marina",
    street: "Marina Walk",
    unitHint: "12B",
    ...POINT("Dubai Marina", { lat: -0.0008, lng: 0.0011 }),
  },
  {
    id: "address-downtown",
    label: "The Address Downtown, Downtown Dubai",
    building: "The Address Downtown",
    emirate: "Dubai",
    community: "Downtown",
    street: "Mohammed Bin Rashid Boulevard",
    unitHint: "4201",
    ...POINT("Downtown", { lat: 0.0004, lng: 0.0003 }),
  },
  {
    id: "blvd-crescent",
    label: "Boulevard Crescent, Downtown Dubai",
    building: "Boulevard Crescent",
    emirate: "Dubai",
    community: "Downtown",
    street: "Mohammed Bin Rashid Boulevard",
    unitHint: "1105",
    ...POINT("Downtown", { lat: -0.001, lng: 0.0008 }),
  },
  {
    id: "jlt-saba-1",
    label: "Saba Tower 1, JLT",
    building: "Saba Tower 1",
    emirate: "Dubai",
    community: "JLT",
    street: "Cluster E",
    unitHint: "1806",
    ...POINT("JLT", { lat: 0.0006, lng: -0.0004 }),
  },
  {
    id: "jlt-gold-crest",
    label: "Gold Crest Executive, JLT",
    building: "Gold Crest Executive",
    emirate: "Dubai",
    community: "JLT",
    street: "Cluster C",
    unitHint: "904",
    ...POINT("JLT", { lat: -0.0005, lng: 0.0007 }),
  },
  {
    id: "jvc-district-12",
    label: "District 12 Villa, JVC",
    building: "District 12",
    emirate: "Dubai",
    community: "JVC",
    street: "Hessa Street",
    unitHint: "Villa 22",
    ...POINT("JVC", { lat: 0.0014, lng: -0.0009 }),
  },
  {
    id: "al-barsha-1",
    label: "Al Barsha 1 Villa Compound",
    building: "Al Barsha 1 Compound",
    emirate: "Dubai",
    community: "Al Barsha",
    street: "Al Barsha Road",
    unitHint: "Villa 8",
    ...POINT("Al Barsha", { lat: 0.0009, lng: 0.0005 }),
  },
  {
    id: "jumeirah-2-villa",
    label: "Jumeirah 2 Beach Villa",
    building: "Jumeirah 2 Villa",
    emirate: "Dubai",
    community: "Jumeirah",
    street: "Al Wasl Road",
    unitHint: "Villa 14",
    ...POINT("Jumeirah", { lat: -0.0007, lng: 0.0012 }),
  },
  {
    id: "palm-shoreline",
    label: "Shoreline Apartments, Palm Jumeirah",
    building: "Shoreline 8",
    emirate: "Dubai",
    community: "Palm Jumeirah",
    street: "East Crescent Road",
    unitHint: "A-12",
    ...POINT("Palm Jumeirah", { lat: 0.0003, lng: -0.0008 }),
  },
  {
    id: "reem-sun-tower",
    label: "Sun Tower, Al Reem Island",
    building: "Sun Tower",
    emirate: "Abu Dhabi",
    community: "Al Reem Island",
    street: "Al Reem Street",
    unitHint: "3102",
    lat: 24.494, lng: 54.407,
  },
  {
    id: "sharjah-al-majaz",
    label: "Al Majaz 3 Tower, Sharjah",
    building: "Al Majaz 3",
    emirate: "Sharjah",
    community: "Al Majaz",
    street: "Corniche Street",
    unitHint: "1504",
    lat: 25.326, lng: 55.381,
  },
];

export function searchUaePlaces(query: string, limit = 6): GeocodeHit[] {
  const needle = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (needle.length < 2) return [];
  return UAE_GEOCODE_INDEX.filter((hit) => {
    const hay = `${hit.label} ${hit.building} ${hit.community} ${hit.street} ${hit.emirate}`.toLowerCase();
    return hay.includes(needle);
  }).slice(0, limit);
}

export function customGeocodeFromQuery(query: string): GeocodeHit {
  const building = query.trim().replace(/\s+/g, " ");
  const marina = AREA_COORDS["Dubai Marina"] ?? { lat: 25.0805, lng: 55.1403 };
  return {
    id: `custom-${building.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label: `${building}, Dubai`,
    building,
    emirate: "Dubai",
    community: "Dubai Marina",
    street: "",
    unitHint: "",
    lat: marina.lat,
    lng: marina.lng,
  };
}
