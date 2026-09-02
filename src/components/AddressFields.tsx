"use client";

import {
  EMIRATES,
  INSTRUCTION_PRESETS,
  filterCommunities,
  type AddressErrors,
  type Emirate,
  type UaeAddress,
} from "@/lib/uae-address";
import { useEffect, useId, useMemo, useRef, useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function AddressFields({
  value,
  errors,
  onChange,
  idPrefix,
}: {
  value: UaeAddress;
  errors: AddressErrors;
  onChange: (next: UaeAddress) => void;
  idPrefix: string;
}) {
  const patch = (partial: Partial<UaeAddress>) => onChange({ ...value, ...partial });
  const villa = value.dwelling === "villa";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label
          htmlFor={`${idPrefix}-emirate`}
          className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]"
        >
          Emirate
        </label>
        <div className="relative mt-1.5">
          <select
            id={`${idPrefix}-emirate`}
            value={value.emirate}
            onChange={(event) => {
              const emirate = event.target.value as Emirate;
              patch({ emirate, community: "" });
            }}
            className="h-12 w-full appearance-none rounded-2xl border border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] px-3.5 pr-10 text-[16px] text-[oklch(0.22_0.025_55)] outline-none focus:border-[oklch(0.48_0.12_52)]"
          >
            {EMIRATES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Chevron className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[oklch(0.42_0.03_55)]" />
        </div>
      </div>

      <CommunityCombobox
        idPrefix={idPrefix}
        emirate={value.emirate}
        value={value.community}
        error={errors.community}
        onChange={(community) => patch({ community })}
      />

      <div>
        <p id={`${idPrefix}-dwelling-label`} className="text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
          Residential type
        </p>
        <div
          role="tablist"
          aria-labelledby={`${idPrefix}-dwelling-label`}
          className="mt-2 grid grid-cols-2 rounded-full border border-[oklch(0.86_0.02_80)] p-1"
        >
          <DwellingTab
            selected={!villa}
            onClick={() => patch({ dwelling: "apartment" })}
          >
            Apartment / Tower
          </DwellingTab>
          <DwellingTab
            selected={villa}
            onClick={() => patch({ dwelling: "villa" })}
          >
            Villa / Community
          </DwellingTab>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1.2fr_0.8fr]">
        <TextField
          id={`${idPrefix}-building`}
          label={villa ? "Villa / community name" : "Building / tower name"}
          value={value.building}
          error={errors.building}
          autoComplete="address-line1"
          placeholder={villa ? "Arabian Ranches" : "Marina Gate"}
          onChange={(building) => patch({ building })}
        />
        <TextField
          id={`${idPrefix}-unit`}
          label={villa ? "Villa number" : "Apartment number"}
          value={value.unit}
          error={errors.unit}
          autoComplete="address-line2"
          placeholder={villa ? "12" : "2408"}
          onChange={(unit) => patch({ unit })}
        />
      </div>

      <TextField
        id={`${idPrefix}-street`}
        label="Street name"
        value={value.street}
        error={errors.street}
        autoComplete="address-line3"
        placeholder="Al Thanyah Street"
        onChange={(street) => patch({ street })}
      />

      <div>
        <p id={`${idPrefix}-instructions-label`} className="text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
          AJEX courier delivery instructions
        </p>
        <p className="mt-1 max-w-[42ch] text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
          Optional. The driver sees this on the prepaid label.
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby={`${idPrefix}-instructions-label`}>
          {INSTRUCTION_PRESETS.map((preset) => {
            const selected = value.instructions === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => patch({ instructions: selected ? "" : preset })}
                className={`h-10 rounded-full px-3.5 text-[14px] font-semibold transition-colors duration-200 ${
                  selected
                    ? "bg-[oklch(0.48_0.12_52)] text-[oklch(0.98_0.012_85)]"
                    : "border border-[oklch(0.84_0.02_75)] bg-[#F9F6F0] text-[oklch(0.22_0.025_55)] hover:bg-[oklch(0.96_0.012_82)]"
                }`}
                style={{ transitionTimingFunction: EASE }}
                aria-pressed={selected}
              >
                {preset}
              </button>
            );
          })}
        </div>
        <textarea
          id={`${idPrefix}-instructions`}
          aria-labelledby={`${idPrefix}-instructions-label`}
          value={value.instructions}
          rows={3}
          placeholder="Gate code, tower, or who to call"
          onChange={(event) => patch({ instructions: event.target.value })}
          className="mt-3 w-full resize-none rounded-2xl border border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] px-3.5 py-3 text-[16px] leading-6 text-[oklch(0.22_0.025_55)] outline-none placeholder:text-[oklch(0.5_0.025_55)] focus:border-[oklch(0.48_0.12_52)]"
        />
      </div>

      {value.emirate !== "Dubai" ? (
        <p className="max-w-[42ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
          Home courier currently launches in Dubai. Your address is saved; we’ll
          confirm the zone by SMS before the first pickup.
        </p>
      ) : null}
    </div>
  );
}

function CommunityCombobox({
  idPrefix,
  emirate,
  value,
  error,
  onChange,
}: {
  idPrefix: string;
  emirate: Emirate;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const listId = useId();
  const inputId = `${idPrefix}-community`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setQuery(value);
  }, [value, emirate]);

  const options = useMemo(() => filterCommunities(emirate, query), [emirate, query]);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [query, emirate]);

  const choose = (name: string) => {
    onChange(name);
    setQuery(name);
    setOpen(false);
  };

  return (
    <div ref={rootRef}>
      <label htmlFor={inputId} className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
        Community / neighborhood
      </label>
      <div className="relative mt-1.5">
        <input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="address-level2"
          placeholder="Search JVC, Marina, JLT Cluster X…"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            const exact = filterCommunities(emirate, "").find(
              (name) => name.toLowerCase() === next.trim().toLowerCase(),
            );
            onChange(exact ?? "");
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((current) => Math.min(options.length - 1, current + 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((current) => Math.max(0, current - 1));
            }
            if (event.key === "Enter") {
              if (open) {
                event.preventDefault();
                if (options[active]) choose(options[active]);
              }
            }
            if (event.key === "Escape") setOpen(false);
          }}
          className={`h-12 w-full rounded-2xl border bg-[#F9F6F0] px-3.5 pr-10 text-[16px] text-[oklch(0.22_0.025_55)] outline-none placeholder:text-[oklch(0.5_0.025_55)] focus:border-[oklch(0.48_0.12_52)] ${
            error ? "border-[oklch(0.62_0.1_40)]" : "border-[oklch(0.88_0.018_80)]"
          }`}
        />
        <Chevron className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[oklch(0.42_0.03_55)]" />
        {open ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-[1.15rem] border border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] py-1.5 shadow-[0_18px_40px_-24px_oklch(0.22_0.03_55/0.45)]"
          >
            {options.length === 0 ? (
              <li className="px-3.5 py-3 text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
                No community matches that search.
              </li>
            ) : (
              options.map((name, index) => {
                const selected = name === value;
                const highlighted = index === active;
                return (
                  <li key={name} role="presentation">
                    <button
                      type="button"
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => choose(name)}
                      className={`flex w-full px-3.5 py-2.5 text-left text-[16px] leading-6 ${
                        highlighted
                          ? "bg-[oklch(0.96_0.01_82)] text-[oklch(0.22_0.025_55)]"
                          : "text-[oklch(0.22_0.025_55)]"
                      }`}
                    >
                      {name}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
          {error}
        </p>
      ) : (
        <p className="mt-1.5 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
          Search your community so AJEX can zone pickup and delivery.
        </p>
      )}
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
        {label}
      </label>
      <input
        id={id}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1.5 h-12 w-full rounded-2xl border bg-[#F9F6F0] px-3.5 text-[16px] text-[oklch(0.22_0.025_55)] outline-none placeholder:text-[oklch(0.5_0.025_55)] focus:border-[oklch(0.48_0.12_52)] ${
          error ? "border-[oklch(0.62_0.1_40)]" : "border-[oklch(0.88_0.018_80)]"
        }`}
      />
      {error ? (
        <p role="alert" className="mt-1.5 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function DwellingTab({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`h-10 rounded-full px-2 text-[13px] leading-4 transition-colors duration-200 ${
        selected
          ? "bg-[oklch(0.96_0.01_82)] font-semibold text-[oklch(0.22_0.025_55)]"
          : "font-medium text-[oklch(0.5_0.03_55)]"
      }`}
      style={{ transitionTimingFunction: EASE }}
    >
      {children}
    </button>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className} aria-hidden="true">
      <path
        d="M2.5 5 7 9.5 11.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
