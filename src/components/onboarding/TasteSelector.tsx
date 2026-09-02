"use client";

import { WashiTape } from "@/components/brand/WashiTape";
import {
  rememberBrand,
  resolveBrandLabel,
  suggestBrands,
} from "@/lib/brands";
import { TASTE_AESTHETICS, type TasteAestheticId } from "@/lib/taste";
import { FormEvent, useMemo, useState } from "react";

const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";

const MOOD_PLACEMENT = [
  {
    wrap: "absolute left-0 top-0 z-[1] w-[58%]",
    tilt: "rotate-[2.4deg]",
    tape: { tone: "mustard", corner: "tl" },
    well: "aspect-[3/4] min-h-[13.25rem]",
  },
  {
    wrap: "absolute -right-1 top-6 z-[3] w-[50%]",
    tilt: "-rotate-[5.5deg]",
    tape: { tone: "rose", corner: "tr" },
    well: "aspect-[4/5] min-h-[8.75rem]",
  },
  {
    wrap: "absolute left-[-1%] top-[19.5rem] z-[2] w-[52%]",
    tilt: "rotate-[3.8deg]",
    tape: { tone: "denim", corner: "tl" },
    well: "aspect-[4/5] min-h-[8.75rem]",
  },
  {
    wrap: "absolute right-[-2%] top-[22.25rem] z-[4] w-[56%]",
    tilt: "-rotate-[1.8deg]",
    tape: { tone: "mustard", corner: "tr" },
    well: "aspect-[16/9] min-h-[7.5rem]",
  },
] as const;

const CLIP_FILLS = ["bg-[#E4D5C1]", "bg-[#D8829D]", "bg-[#4B6584] text-[#F9F6F0]"] as const;

export function TasteSelector({
  pending = false,
  onContinue,
}: {
  pending?: boolean;
  onContinue: (input: { brands: string[]; aesthetics: TasteAestheticId[] }) => void;
}) {
  const [moods, setMoods] = useState<TasteAestheticId[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pillKey, setPillKey] = useState(0);

  const suggestions = useMemo(
    () => suggestBrands(query, brands, brands),
    [query, brands],
  );
  const resolved = resolveBrandLabel(query, brands);
  const exactHit = suggestions.some(
    (brand) => brand.toLowerCase() === query.trim().toLowerCase(),
  );
  const showCustom =
    query.trim().length > 1 &&
    !exactHit &&
    !brands.some((brand) => brand.toLowerCase() === resolved.toLowerCase());

  const addBrand = (raw: string) => {
    const label = resolveBrandLabel(raw, brands);
    if (!label) return;
    if (brands.some((brand) => brand.toLowerCase() === label.toLowerCase())) {
      setQuery("");
      return;
    }
    rememberBrand(label);
    setBrands((current) => [...current, label]);
    setPillKey((value) => value + 1);
    setQuery("");
    setError(null);
  };

  const toggleMood = (id: TasteAestheticId) => {
    setMoods((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    setError(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const pendingBrand = query.trim();
    const nextBrands = [...brands];
    if (pendingBrand) {
      const label = resolveBrandLabel(pendingBrand, brands);
      if (
        label &&
        !nextBrands.some((brand) => brand.toLowerCase() === label.toLowerCase())
      ) {
        rememberBrand(label);
        nextBrands.push(label);
        setBrands(nextBrands);
        setQuery("");
      }
    }
    if (moods.length === 0 && nextBrands.length === 0) {
      setError("Pick a mood or add a label from your dream closet.");
      return;
    }
    onContinue({ brands: nextBrands, aesthetics: moods });
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col pb-24">
      <h1 className="text-[32px] leading-none text-[#2A1A14]">How do you dress</h1>
      <p className="mt-3 max-w-[40ch] font-[family-name:var(--font-handwritten)] text-[17px] leading-6 text-[#6B4A3A]">
        Four prints, taped into the spread. Then type any house you actually hunt — even if we have never listed it.
      </p>

      <div className="relative mt-8 h-[36.5rem]">
        {TASTE_AESTHETICS.map((mood, index) => {
          const selected = moods.includes(mood.id);
          const place = MOOD_PLACEMENT[index];
          const clipping = mood.frame === "clipping";
          return (
            <button
              key={mood.id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleMood(mood.id)}
              className={`${place.wrap} ${place.tilt} text-left focus-visible:z-[5]`}
              style={{ transitionTimingFunction: EASE }}
            >
              {clipping ? (
                <ClippingPrint
                  src={mood.image}
                  crop={mood.crop}
                  label={mood.label}
                  line={mood.line}
                  selected={selected}
                  well={place.well}
                  tape={place.tape}
                />
              ) : (
                <PolaroidPrint
                  src={mood.image}
                  crop={mood.crop}
                  label={mood.label}
                  line={mood.line}
                  selected={selected}
                  well={place.well}
                  tape={place.tape}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="cardboard-sheet relative mt-10 border border-[#2A1A14] px-4 pt-5 pb-4 shadow-[3px_3px_0_0_#2A1A14]">
        <WashiTape tone="denim" corner="tr" />
        <label
          htmlFor="dream-label"
          className="block font-[family-name:var(--font-typewriter)] text-[14px] leading-5 text-[#2A1A14]"
        >
          What label is in your dream closet?
        </label>
        <input
          id="dream-label"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (showCustom) addBrand(query);
              else if (suggestions[0]) addBrand(suggestions[0]);
              else addBrand(query);
            }
          }}
          placeholder="Type a house — Zimmermann, Bouguessa, yours"
          className="notebook-line mt-2 h-12 w-full border-0 border-b border-[#2A1A14] bg-transparent px-0 text-[16px] text-[#2A1A14] outline-none placeholder:text-[#6B4A3A]"
        />

        {(suggestions.length > 0 || showCustom) && query.trim() ? (
          <div className="mt-3 flex flex-col gap-1.5">
            {suggestions.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => addBrand(brand)}
                className="border border-[#2A1A14] bg-[#F4EFE6] px-3.5 py-2.5 text-left font-[family-name:var(--font-typewriter)] text-[14px] leading-5 text-[#2A1A14]"
              >
                {brand}
              </button>
            ))}
            {showCustom ? (
              <button
                type="button"
                onClick={() => addBrand(query)}
                className="border border-[#2A1A14] bg-[#D8829D] px-3.5 py-2.5 text-left font-[family-name:var(--font-handwritten)] text-[16px] leading-5 text-[#2A1A14]"
              >
                + Add custom brand ‘{resolved}’
              </button>
            ) : null}
          </div>
        ) : null}

        {brands.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2.5">
            {brands.map((brand, index) => (
              <li key={`${brand}-${index === brands.length - 1 ? pillKey : brand}`}>
                <button
                  type="button"
                  onClick={() =>
                    setBrands((current) => current.filter((item) => item !== brand))
                  }
                  className={`taste-pill-in inline-block border border-[#2A1A14] px-2.5 py-1 font-[family-name:var(--font-typewriter)] text-[13px] shadow-[2px_2px_0_0_#2A1A14] ${CLIP_FILLS[index % CLIP_FILLS.length]} ${
                    index % 2 === 0 ? "rotate-1" : "-rotate-1"
                  }`}
                  aria-label={`Remove ${brand}`}
                >
                  {brand}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 font-[family-name:var(--font-handwritten)] text-[16px] leading-5 text-[#8B3A32]"
        >
          {error}
        </p>
      ) : null}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20">
        <div className="pointer-events-auto relative mx-auto max-w-[28rem] border-t border-[#2A1A14] bg-[#F9F6F0] px-5 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
          <span
            aria-hidden
            className="washi-grain pointer-events-none absolute -top-2 left-8 h-3 w-20 -rotate-2 bg-[rgba(241,196,15,0.8)]"
          />
          <button
            type="submit"
            disabled={pending}
            className="flex h-12 w-full items-center justify-center border border-[#2A1A14] bg-[#D8829D] text-[14px] font-semibold tracking-[-0.01em] text-[#2A1A14] shadow-[4px_4px_0_0_#2A1A14] disabled:bg-[#C9B8A4] disabled:text-[#6B4A3A] disabled:shadow-none"
            style={{ transitionTimingFunction: EASE }}
          >
            {pending ? "Saving…" : "Continue"}
          </button>
        </div>
      </div>
    </form>
  );
}

function PolaroidPrint({
  src,
  crop,
  label,
  line,
  selected,
  well,
  tape,
}: {
  src: string;
  crop: string;
  label: string;
  line: string;
  selected: boolean;
  well: string;
  tape: { tone: "mustard" | "rose" | "denim"; corner: "tl" | "tr" | "bl" | "br" };
}) {
  return (
    <span
      className={`relative flex flex-col border border-[#2A1A14] bg-[#F4EFE6] p-[0.55rem] pb-0 ${
        selected ? "shadow-[5px_5px_0_0_#D8829D]" : "shadow-[4px_4px_0_0_#2A1A14]"
      }`}
    >
      <WashiTape tone={tape.tone} corner={tape.corner} />
      {selected ? <WashiTape tone="rose" corner="br" /> : null}
      <PrintWell src={src} crop={crop} className={well} />
      <span className="px-1 pt-2.5 pb-3">
        <span className="block font-[family-name:var(--font-typewriter)] text-[14px] leading-5 text-[#2A1A14]">
          {label}
        </span>
        <span className="mt-1 block font-[family-name:var(--font-handwritten)] text-[13px] leading-4 text-[#6B4A3A]">
          {line}
        </span>
      </span>
      {selected ? <PickedStamp /> : null}
    </span>
  );
}

function ClippingPrint({
  src,
  crop,
  label,
  line,
  selected,
  well,
  tape,
}: {
  src: string;
  crop: string;
  label: string;
  line: string;
  selected: boolean;
  well: string;
  tape: { tone: "mustard" | "rose" | "denim"; corner: "tl" | "tr" | "bl" | "br" };
}) {
  return (
    <span className="relative block">
      <WashiTape tone={tape.tone} corner={tape.corner} />
      <WashiTape tone="rose" corner="bl" />
      {selected ? <WashiTape tone="denim" corner="br" /> : null}
      <span
        className={`paper-tear relative block border border-[#2A1A14] bg-[#F4EFE6] p-[0.35rem] pb-[0.2rem] ${
          selected ? "shadow-[5px_5px_0_0_#D8829D]" : "shadow-[4px_4px_0_0_#2A1A14]"
        }`}
      >
        <PrintWell src={src} crop={crop} className={well} />
      </span>
      <span className="washi-grain relative -mt-3 ml-4 inline-block max-w-[calc(100%-1.5rem)] -rotate-1 bg-[rgba(241,196,15,0.8)] px-3 py-1.5">
        <span className="block font-[family-name:var(--font-typewriter)] text-[14px] leading-5 text-[#2A1A14]">
          {label}
        </span>
        <span className="mt-0.5 block font-[family-name:var(--font-handwritten)] text-[13px] leading-4 text-[#2A1A14]">
          {line}
        </span>
      </span>
      {selected ? <PickedStamp /> : null}
    </span>
  );
}

function PrintWell({
  src,
  crop,
  className,
}: {
  src: string;
  crop: string;
  className: string;
}) {
  return (
    <span className={`print-well relative block overflow-hidden bg-[#E4D5C1] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: crop }}
      />
      <span aria-hidden className="print-grain pointer-events-none absolute inset-0 mix-blend-overlay opacity-50" />
    </span>
  );
}

function PickedStamp() {
  return (
    <span
      aria-hidden
      className="stamp-ink pointer-events-none absolute -right-2 -bottom-1 z-10 grid size-[3.6rem] place-items-center font-[family-name:var(--font-typewriter)] text-[9px] leading-none tracking-[0.08em] text-[#2A1A14] uppercase"
    >
      this
      <br />
      one
    </span>
  );
}
