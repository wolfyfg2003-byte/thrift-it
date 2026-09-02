"use client";

import { DropCalendar } from "@/components/DropCalendar";
import { SizeMatrix } from "@/components/SizeMatrix";
import {
  RADIUS_STEPS,
  radiusStepIndex,
} from "@/lib/geo";
import type { Listing } from "@/lib/listings";
import {
  toggleValue,
  type DeckFilters,
} from "@/lib/filters";
import {
  loadRememberedBrands,
  rememberBrand,
  resolveBrandLabel,
  suggestBrands,
} from "@/lib/brands";
import { useEffect, useId, useMemo, useRef, useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export type GeoStatus = "idle" | "locating" | "ready" | "denied" | "fallback";

export function FilterDrawer({
  open,
  filters,
  geoStatus = "idle",
  geoMessage = null,
  onChange,
  upcomingDrops = [],
  onToggleWatch,
  onClose,
}: {
  open: boolean;
  filters: DeckFilters;
  geoStatus?: GeoStatus;
  geoMessage?: string | null;
  onChange: (next: DeckFilters) => void;
  upcomingDrops?: Listing[];
  onToggleWatch?: (id: string) => void;
  onClose?: () => void;
}) {
  const [pane, setPane] = useState<"filters" | "calendar">("filters");

  return (
    <div
      className="grid transition-[grid-template-rows] duration-300"
      style={{
        gridTemplateRows: open ? "1fr" : "0fr",
        transitionTimingFunction: EASE,
      }}
    >
      <div className="overflow-hidden">
        <div className="mt-3 rounded-[1.35rem] bg-[oklch(0.96_0.01_82)] px-4 py-4">
          <div
            role="tablist"
            aria-label="Filter drawer"
            className="grid grid-cols-2 gap-1 rounded-full bg-[oklch(0.93_0.015_80)] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={pane === "filters"}
              onClick={() => {
                if (pane === "filters") {
                  onClose?.();
                  return;
                }
                setPane("filters");
              }}
              className={`h-9 rounded-full text-[14px] transition-colors duration-200 ${
                pane === "filters"
                  ? "bg-[#F9F6F0] font-semibold text-[oklch(0.22_0.025_55)] shadow-[0_6px_14px_-8px_oklch(0.22_0.03_55/0.4)]"
                  : "font-medium text-[oklch(0.42_0.03_55)]"
              }`}
              style={{ transitionTimingFunction: EASE }}
            >
              Filters
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pane === "calendar"}
              onClick={() => setPane("calendar")}
              className={`h-9 rounded-full text-[14px] transition-colors duration-200 ${
                pane === "calendar"
                  ? "bg-[#F9F6F0] font-semibold text-[oklch(0.22_0.025_55)] shadow-[0_6px_14px_-8px_oklch(0.22_0.03_55/0.4)]"
                  : "font-medium text-[oklch(0.42_0.03_55)]"
              }`}
              style={{ transitionTimingFunction: EASE }}
            >
              Drop Calendar
            </button>
          </div>

          {pane === "calendar" ? (
            <DropCalendar
              drops={upcomingDrops}
              onToggleWatch={onToggleWatch ?? (() => undefined)}
            />
          ) : (
            <>
          <p className="mt-5 text-[20px] font-semibold tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
            Brand
          </p>
          <BrandPicker
            selected={filters.brands}
            enabled={open}
            onChange={(brands) => onChange({ ...filters, brands })}
          />

          <p className="mt-7 text-[20px] font-semibold tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
            Size
          </p>
          <div className="mt-3">
            <SizeMatrix
              selected={filters.sizes}
              onChange={(sizes) => onChange({ ...filters, sizes })}
            />
          </div>

          <DistanceRadius
            radiusKm={filters.radiusKm}
            geoStatus={geoStatus}
            geoMessage={geoMessage}
            onChange={(radiusKm) => onChange({ ...filters, radiusKm })}
          />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DistanceRadius({
  radiusKm,
  geoStatus,
  geoMessage,
  onChange,
}: {
  radiusKm: number | null;
  geoStatus: GeoStatus;
  geoMessage: string | null;
  onChange: (radiusKm: number | null) => void;
}) {
  const index = radiusStepIndex(radiusKm);
  const current = RADIUS_STEPS[index] ?? RADIUS_STEPS[RADIUS_STEPS.length - 1];
  const last = RADIUS_STEPS.length - 1;
  const fill = last === 0 ? 0 : (index / last) * 100;

  const move = (next: number) => {
    const clamped = Math.max(0, Math.min(last, next));
    onChange(RADIUS_STEPS[clamped]?.km ?? null);
  };

  return (
    <div className="mt-7">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[20px] font-semibold tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
          Distance Radius
        </p>
        <p className="text-[14px] font-semibold tabular-nums text-[oklch(0.22_0.025_55)]">
          {current.label}
        </p>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label="Distance radius"
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={index}
        aria-valuetext={current.label}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            move(index + 1);
          }
          if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            move(index - 1);
          }
          if (event.key === "Home") {
            event.preventDefault();
            move(0);
          }
          if (event.key === "End") {
            event.preventDefault();
            move(last);
          }
        }}
        className="relative mt-4 h-8 cursor-pointer touch-none"
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - rect.left) / rect.width;
          move(Math.round(ratio * last));
        }}
      >
        <span className="absolute top-1/2 right-0 left-0 h-[2px] -translate-y-1/2 rounded-full bg-[oklch(0.86_0.02_80)]" />
        <span
          className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 rounded-full bg-[oklch(0.48_0.12_52)] transition-[width] duration-200"
          style={{ width: `${fill}%`, transitionTimingFunction: EASE }}
        />
        {RADIUS_STEPS.map((step, stepIndex) => (
          <span
            key={step.label}
            className={`absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              stepIndex <= index
                ? "bg-[oklch(0.48_0.12_52)]"
                : "bg-[oklch(0.78_0.02_75)]"
            }`}
            style={{ left: `${last === 0 ? 0 : (stepIndex / last) * 100}%` }}
          />
        ))}
        <span
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[oklch(0.48_0.12_52)] bg-[#F9F6F0] shadow-[0_8px_16px_-8px_oklch(0.22_0.03_55/0.5)] transition-[left] duration-200"
          style={{
            left: `${fill}%`,
            transitionTimingFunction: EASE,
          }}
        />
      </div>

      <div className="mt-2 grid grid-cols-5 gap-1">
        {RADIUS_STEPS.map((step, stepIndex) => {
          const selected = stepIndex === index;
          return (
            <button
              key={step.label}
              type="button"
              onClick={() => onChange(step.km)}
              className={`text-center text-[12px] leading-4 transition-colors duration-200 ${
                selected
                  ? "font-semibold text-[oklch(0.22_0.025_55)]"
                  : "font-medium text-[oklch(0.45_0.03_55)] hover:text-[oklch(0.22_0.025_55)]"
              }`}
              style={{ transitionTimingFunction: EASE }}
            >
              {step.label}
            </button>
          );
        })}
      </div>

      {radiusKm != null ? (
        <p className="mt-2.5 max-w-[42ch] text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
          {geoStatus === "locating"
            ? "Finding your position…"
            : geoStatus === "denied"
              ? "Location is blocked. Allow it in the browser to cut by radius."
              : geoStatus === "fallback"
                ? geoMessage ?? "Using your saved address until GPS is allowed."
                : geoStatus === "ready"
                  ? "Showing pieces within this walk of you."
                  : "Pieces beyond this radius leave the rail."}
        </p>
      ) : null}
    </div>
  );
}

function BrandPicker({
  selected,
  enabled,
  onChange,
}: {
  selected: string[];
  enabled: boolean;
  onChange: (brands: string[]) => void;
}) {
  const listId = useId();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [remembered, setRemembered] = useState<string[]>([]);

  useEffect(() => {
    setRemembered(loadRememberedBrands());
  }, []);

  const matches = useMemo(
    () => suggestBrands(query, remembered, selected),
    [query, remembered, selected],
  );
  const draft = resolveBrandLabel(query, remembered);
  const alreadyOn = selected.some(
    (item) => item.toLowerCase() === draft.toLowerCase(),
  );
  const exactMatch = matches.some(
    (item) => item.toLowerCase() === draft.toLowerCase(),
  );
  const canAdd = draft.length > 0 && !alreadyOn && !exactMatch;
  const options = useMemo(
    () =>
      [
        ...(canAdd ? [{ kind: "add" as const, label: draft }] : []),
        ...matches.map((label) => ({ kind: "match" as const, label })),
      ],
    [canAdd, draft, matches],
  );
  const listOpen = enabled && open && query.trim().length > 0;

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!enabled) setOpen(false);
  }, [enabled]);

  const choose = (brand: string) => {
    const label = resolveBrandLabel(brand, remembered);
    if (!label) return;
    if (selected.some((item) => item.toLowerCase() === label.toLowerCase())) {
      setQuery("");
      setOpen(false);
      return;
    }
    rememberBrand(label);
    setRemembered(loadRememberedBrands());
    onChange([...selected, label]);
    setQuery("");
    setOpen(false);
  };

  const commitDraft = () => {
    if (!draft || alreadyOn) return;
    choose(draft);
  };

  return (
    <div ref={rootRef} className="mt-2.5">
      {selected.length > 0 ? (
        <ul className="mb-2.5 flex flex-wrap gap-1.5">
          {selected.map((brand) => (
            <li key={brand}>
              <span className="inline-flex h-8 max-w-full items-center gap-1 rounded-full border border-[oklch(0.84_0.02_75)] bg-[#F9F6F0] py-0 pr-1.5 pl-3 text-[12px] leading-4 font-semibold text-[oklch(0.22_0.025_55)]">
                <span className="truncate">{brand}</span>
                <button
                  type="button"
                  aria-label={`Remove ${brand}`}
                  onClick={() =>
                    onChange(selected.filter((item) => item !== brand))
                  }
                  className="grid size-6 shrink-0 place-items-center rounded-full text-[oklch(0.42_0.03_55)] transition-colors duration-200 hover:bg-[oklch(0.96_0.012_82)] hover:text-[oklch(0.22_0.025_55)]"
                  style={{ transitionTimingFunction: EASE }}
                >
                  <CloseIcon />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[oklch(0.45_0.03_55)]">
          <SearchIcon />
        </span>
        <input
          id={inputId}
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            listOpen && options[active] ? `${listId}-${active}` : undefined
          }
          aria-label="Search brands"
          autoComplete="off"
          enterKeyHint="enter"
          placeholder="Type any house, then Enter"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((current) =>
                options.length === 0
                  ? 0
                  : Math.min(options.length - 1, current + 1),
              );
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((current) => Math.max(0, current - 1));
            }
            if (event.key === "Enter" || event.key === ",") {
              if (!draft) return;
              event.preventDefault();
              const pick = options[active];
              choose(pick?.label ?? draft);
            }
            if (event.key === "Escape") setOpen(false);
          }}
          className="h-12 w-full rounded-2xl border border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] pr-12 pl-11 text-[16px] text-[oklch(0.22_0.025_55)] outline-none placeholder:text-[oklch(0.5_0.025_55)] focus:border-[oklch(0.48_0.12_52)]"
        />
        <button
          type="button"
          aria-label={draft ? `Add ${draft}` : "Add brand"}
          disabled={!draft || alreadyOn}
          onClick={commitDraft}
          className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[oklch(0.42_0.03_55)] transition-colors duration-200 hover:bg-[oklch(0.96_0.01_82)] hover:text-[oklch(0.22_0.025_55)] disabled:opacity-30"
          style={{ transitionTimingFunction: EASE }}
        >
          <PlusIcon />
        </button>
      </div>
      {selected.length === 0 && query.trim().length === 0 ? (
        <p className="mt-2 max-w-[42ch] text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
          Enter or + pins any house as a tag. Unknown labels are saved here.
        </p>
      ) : null}

      {listOpen && options.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="mt-1.5 rounded-[1.15rem] border border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] py-1.5 shadow-[0_18px_40px_-24px_oklch(0.22_0.03_55/0.45)]"
        >
          {options.map((option, index) => {
            const highlighted = index === active;
            return (
              <li key={`${option.kind}-${option.label}`} role="presentation">
                <button
                  type="button"
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={highlighted}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(option.label)}
                  className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[16px] leading-6 ${
                    highlighted
                      ? "bg-[oklch(0.96_0.01_82)] text-[oklch(0.22_0.025_55)]"
                      : "text-[oklch(0.22_0.025_55)]"
                  }`}
                >
                  {option.kind === "add" ? (
                    <>
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[oklch(0.96_0.01_82)] text-[oklch(0.38_0.03_55)]">
                        <PlusIcon />
                      </span>
                      <span>
                        Add “{option.label}”
                      </span>
                    </>
                  ) : (
                    option.label
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        d="M2 2l6 6M8 2 2 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12.2 12.2 15.5 15.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M7 2.5v9M2.5 7h9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
