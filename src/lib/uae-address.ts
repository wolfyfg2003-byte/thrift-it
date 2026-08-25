export const EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
] as const;

export type Emirate = (typeof EMIRATES)[number];

export const COMMUNITIES: Record<Emirate, readonly string[]> = {
  Dubai: [
    "Dubai Marina",
    "Downtown",
    "Palm Jumeirah",
    "JVC",
    "JLT",
    "JLT Cluster X",
    "DIFC",
    "Jumeirah",
    "Al Barsha",
    "Al Quoz",
  ],
  "Abu Dhabi": [
    "Al Reem Island",
    "Yas Island",
    "Saadiyat Island",
    "Khalifa City",
    "Al Raha",
  ],
  Sharjah: ["Al Majaz", "Al Khan", "Muwaileh", "Al Nahda"],
  Ajman: ["Al Nuaimiya", "Al Rashidiya", "Ajman Corniche"],
  "Ras Al Khaimah": ["Al Hamra", "Mina Al Arab", "Al Nakheel"],
  Fujairah: ["Fujairah City", "Al Faseel"],
  "Umm Al Quwain": ["UAQ City", "Al Raafa"],
};

export const INSTRUCTION_PRESETS = [
  "Drop at front desk security",
  "Call before driving inside gate",
  "Leave at reception",
] as const;

export type Dwelling = "apartment" | "villa";

export type UaeAddress = {
  emirate: Emirate;
  community: string;
  dwelling: Dwelling;
  building: string;
  unit: string;
  street: string;
  instructions: string;
};

export type AddressErrors = Partial<Record<keyof UaeAddress, string>>;

export const EMPTY_ADDRESS: UaeAddress = {
  emirate: "Dubai",
  community: "",
  dwelling: "apartment",
  building: "",
  unit: "",
  street: "",
  instructions: "",
};

export function normalizeAddress(
  raw: Partial<UaeAddress> | null | undefined,
  fallback: UaeAddress = EMPTY_ADDRESS,
): UaeAddress {
  const next = { ...fallback, ...(raw ?? {}) };
  return {
    emirate: EMIRATES.includes(next.emirate as Emirate)
      ? (next.emirate as Emirate)
      : fallback.emirate,
    community: typeof next.community === "string" ? next.community : fallback.community,
    dwelling: next.dwelling === "villa" ? "villa" : "apartment",
    building: typeof next.building === "string" ? next.building : fallback.building,
    unit: typeof next.unit === "string" ? next.unit : fallback.unit,
    street: typeof next.street === "string" ? next.street : fallback.street,
    instructions:
      typeof next.instructions === "string" ? next.instructions : fallback.instructions,
  };
}

export function communitiesFor(emirate: Emirate): readonly string[] {
  return COMMUNITIES[emirate];
}

export function filterCommunities(emirate: Emirate, query: string): string[] {
  const needle = query.trim().toLowerCase();
  const list = communitiesFor(emirate);
  if (!needle) return [...list];
  return list.filter((name) => name.toLowerCase().includes(needle));
}

export function validateAddress(address: UaeAddress): AddressErrors {
  const errors: AddressErrors = {};
  if (!address.community.trim()) {
    errors.community = "Select your community so AJEX can zone the driver.";
  }
  if (!address.building.trim()) {
    errors.building =
      address.dwelling === "villa"
        ? "Enter the villa or community name."
        : "Enter the building or tower name.";
  }
  if (!address.unit.trim()) {
    errors.unit =
      address.dwelling === "villa"
        ? "Enter the villa number."
        : "Enter the apartment number.";
  }
  if (!address.street.trim()) {
    errors.street = "Enter the street or floor for the courier.";
  }
  return errors;
}

export function formatAddressLine(address: UaeAddress): string {
  const parts = [
    address.unit,
    address.building,
    address.street,
    address.community,
    address.emirate,
  ].filter((part) => part.trim().length > 0);
  return parts.join(" · ");
}

export function isAddressComplete(address: UaeAddress): boolean {
  return Object.keys(validateAddress(address)).length === 0;
}
