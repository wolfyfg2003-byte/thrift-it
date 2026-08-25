const STORAGE_KEY = "thrift-it.custom-brands";
const REMEMBER_CAP = 40;
const SUGGEST_CAP = 6;

/**
 * Suggestion index for typeahead — not a closed catalog.
 * Any typed house can still be added as a filter tag.
 */
export const BRAND_INDEX = [
  "Atelier Noor",
  "Maison Hana",
  "Lumen Modest",
  "Zimmermann",
  "Self-Portrait",
  "House of CB",
  "Rat & Boa",
  "Reformation",
  "Ganni",
  "Staud",
  "Aje",
  "Faithfull the Brand",
  "Cult Gaia",
  "Jacquemus",
  "Rotate",
  "Christopher Esber",
  "Anna Quan",
  "SIR.",
  "Coperni",
  "Magda Butrym",
  "Rixo",
  "Rejina Pyo",
  "Bouguessa",
  "Bambah",
  "Dima Ayad",
  "Amato Couture",
  "Mauzan",
  "Hessa",
  "Verona Collection",
  "Annah Hariri",
  "Aab",
  "The Mantle",
  "Bareekan",
  "Feathers",
  "Madiyah Al Sharqi",
  "Massimo Dutti",
  "Mango",
  "COS",
  "Maje",
  "Sandro",
  "Reiss",
  "Karen Millen",
  "AllSaints",
  "Whistles",
  "& Other Stories",
  "Ted Baker",
  "Claudie Pierlot",
  "Ba&sh",
  "The Giving Movement",
  "S'uce",
  "Dior",
  "Chanel",
  "Hermès",
  "Louis Vuitton",
  "Gucci",
  "Prada",
  "Bottega Veneta",
  "The Row",
  "Khaite",
  "Toteme",
  "Lemaire",
  "Loewe",
  "Celine",
  "Saint Laurent",
  "Balenciaga",
  "Valentino",
  "Alaïa",
  "Chloé",
  "Isabel Marant",
  "Gianvito Rossi",
  "Manolo Blahnik",
  "Jimmy Choo",
  "Mach & Mach",
  "Amina Muaddi",
  "By Far",
  "Veja",
  "Golden Goose",
  "Adidas",
  "Nike",
  "New Balance",
  "Zara",
  "H&M",
  "Uniqlo",
  "Arket",
  "Weekday",
  "Stradivarius",
  "Max Mara",
  "Marella",
  "Theory",
  "Vince",
  "Equipment",
  "Frame",
  "Agolde",
  "Citizens of Humanity",
  "Levi's",
  "Acne Studios",
  "Our Legacy",
  "Ami",
  "A.P.C.",
  "Sézane",
  "Rouje",
  "Doen",
  "Posse",
  "Hansen & Gretel",
  "Significant Other",
  "Shona Joy",
  "Sir the Label",
  "Bec + Bridge",
  "Camilla and Marc",
  "Scanlan Theodore",
  "Matteau",
  "Bondi Born",
  "Dissh",
  "Meshki",
  "Oh Polly",
  "PrettyLittleThing",
  "Revolve",
  "Free People",
  "Anthropologie",
  "Ralph Lauren",
  "Tommy Hilfiger",
  "Polo Ralph Lauren",
  "Michael Kors",
  "Tory Burch",
  "Kate Spade",
  "Coach",
  "MCM",
  "Fendi",
  "Givenchy",
  "Balmain",
  "Versace",
  "Dolce & Gabbana",
  "Moschino",
  "Off-White",
  "Fear of God",
  "Essentials",
  "The Frankie Shop",
  "Anine Bing",
  "Iro",
  "Zadig & Voltaire",
  "The Kooples",
  "Sandro Paris",
  "Maje Paris",
  "Nude Lucy",
  "Country Road",
  "Witchery",
  "Sportmax",
  "Joseph",
  "Me+Em",
  "Cecilie Bahnsen",
  "Simone Rocha",
  "Molly Goddard",
  "Erdem",
  "Temperley",
  "Needle & Thread",
  "Phase Eight",
  "Coast",
  "Oasis",
  "Reiss Studio",
  "Hugo Boss",
  "Canali",
  "Loro Piana",
  "Brunello Cucinelli",
  "Etro",
  "Missoni",
  "Emilio Pucci",
  "Elie Saab",
  "Zuhair Murad",
  "Oscar de la Renta",
  "Carolina Herrera",
  "Marchesa",
  "Alexander McQueen",
  "Stella McCartney",
  "Vivienne Westwood",
  "Burberry",
  "Mulberry",
  "Anissa Aida",
  "Lisa Folawiyo",
  "Imane Ayissi",
  "Adeju Thompson",
  "Hanifa",
  "Thebe Magugu",
  "Ounass",
  "Namshi",
  "Level Shoes",
  "Harvey Nichols",
  "Bloomingdale's",
  "Boutique 1",
] as const;

export type IndexedBrand = (typeof BRAND_INDEX)[number];

/** @deprecated use BRAND_INDEX */
export const UAE_BRANDS = BRAND_INDEX;

function uniqueBrands(names: string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const name of names) {
    const key = name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    next.push(name.trim().replace(/\s+/g, " "));
  }
  return next;
}

export function loadRememberedBrands(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return uniqueBrands(parsed.filter((item): item is string => typeof item === "string"));
  } catch {
    return [];
  }
}

export function rememberBrand(name: string): void {
  if (typeof window === "undefined") return;
  const label = name.trim().replace(/\s+/g, " ");
  if (!label) return;
  const next = uniqueBrands([label, ...loadRememberedBrands()]).slice(0, REMEMBER_CAP);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function brandPool(extra: readonly string[] = []): string[] {
  return uniqueBrands([...extra, ...BRAND_INDEX]);
}

export function resolveBrandLabel(raw: string, extra: readonly string[] = []): string {
  const needle = raw.trim().replace(/\s+/g, " ");
  if (!needle) return "";
  const hit = brandPool(extra).find((brand) => brand.toLowerCase() === needle.toLowerCase());
  if (hit) return hit;
  if (needle === needle.toLowerCase()) {
    return needle.replace(/\b([a-z])/g, (char) => char.toUpperCase());
  }
  return needle;
}

export function suggestBrands(
  query: string,
  extra: readonly string[] = [],
  selected: readonly string[] = [],
): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const taken = new Set(selected.map((brand) => brand.toLowerCase()));
  return brandPool(extra)
    .filter((brand) => {
      const key = brand.toLowerCase();
      return key.includes(needle) && !taken.has(key);
    })
    .sort((a, b) => {
      const aKey = a.toLowerCase();
      const bKey = b.toLowerCase();
      const aScore =
        aKey === needle ? 0 : aKey.startsWith(needle) ? 1 : aKey.includes(` ${needle}`) ? 2 : 3;
      const bScore =
        bKey === needle ? 0 : bKey.startsWith(needle) ? 1 : bKey.includes(` ${needle}`) ? 2 : 3;
      if (aScore !== bScore) return aScore - bScore;
      return a.localeCompare(b);
    })
    .slice(0, SUGGEST_CAP);
}

export function filterBrands(query: string): string[] {
  return suggestBrands(query);
}
