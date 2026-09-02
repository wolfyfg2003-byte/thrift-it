"use client";

import { saveShippingAddress } from "@/app/actions/profile";
import { saveAddress, saveProfile } from "@/lib/profile-store";
import { saveShipping } from "@/lib/shipping-store";
import {
  customGeocodeFromQuery,
  searchUaePlaces,
  type GeocodeHit,
} from "@/lib/uae-geocode";
import {
  addressFromShipping,
  EMIRATES,
  shippingFromParts,
  type Emirate,
  type ShippingAddress,
} from "@/lib/uae-address";
import { FormEvent, useMemo, useState, type ReactNode } from "react";

const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";
const GOLD = "#E5D9C4";
const INK = "oklch(0.22 0.025 55)";
const MUTED = "oklch(0.42 0.03 55)";

type FieldErrors = Partial<Record<keyof ShippingAddress, string>>;

export function AddressPin({
  mobile,
  pending = false,
  onSaved,
}: {
  mobile: string;
  pending?: boolean;
  onSaved: () => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [draft, setDraft] = useState<ShippingAddress>(() =>
    shippingFromParts({
      emirate: "Dubai",
      community: "",
      street: "",
      unit: "",
      mobile,
      building: "",
      lat: null,
      lng: null,
    }),
  );

  const pin = useMemo(() => {
    if (draft.lat == null || draft.lng == null) return { x: 52, y: 48 };
    const x = ((draft.lng - 54.2) / 2.4) * 100;
    const y = ((25.6 - draft.lat) / 1.4) * 100;
    return {
      x: Math.min(88, Math.max(12, x)),
      y: Math.min(82, Math.max(18, y)),
    };
  }, [draft.lat, draft.lng]);

  const openHit = (hit: GeocodeHit) => {
    setDraft(
      shippingFromParts({
        emirate: hit.emirate,
        community: hit.community,
        street: hit.street,
        unit: hit.unitHint,
        mobile,
        building: hit.building,
        lat: hit.lat,
        lng: hit.lng,
      }),
    );
    setQuery(hit.label);
    setHits([]);
    setDrawer(true);
    setErrors({});
  };

  const onQuery = (value: string) => {
    setQuery(value);
    setHits(searchUaePlaces(value));
  };

  const validate = (value: ShippingAddress): FieldErrors => {
    const next: FieldErrors = {};
    if (!value.emirate) next.emirate = "Choose an emirate.";
    if (!value.community.trim()) next.community = "Enter the community.";
    if (!value.street.trim()) next.street = "Enter the street or road.";
    if (!value.unit.trim()) next.unit = "Enter the villa, apartment, or floor.";
    if (!value.mobile.trim()) next.mobile = "Enter a contact mobile.";
    return next;
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    saveShipping(draft);
    saveAddress(addressFromShipping(draft));
    saveProfile({ mobile: draft.mobile });
    await saveShippingAddress(draft);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="flex flex-1 flex-col pb-8">
      <h1
        className="font-[family-name:var(--font-display)] text-[32px] leading-none font-semibold tracking-[-0.03em]"
        style={{ color: INK }}
      >
        Pin the drop
      </h1>
      <p className="mt-3 max-w-[40ch] text-[16px] leading-6" style={{ color: MUTED }}>
        Type the tower, villa, or compound. We geocode it so later deliveries know the exact building.
      </p>

      <div
        className="relative mt-7 h-44 overflow-hidden rounded-[1.5rem] border"
        style={{ borderColor: GOLD, background: "oklch(0.93 0.02 78)" }}
        aria-hidden
      >
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(oklch(0.86_0.02_75)_1px,transparent_1px),linear-gradient(90deg,oklch(0.86_0.02_75)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div
          className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-[oklch(0.48_0.12_52)]"
          style={{
            left: `${pin.x}%`,
            top: `${pin.y}%`,
            borderColor: "#F9F6F0",
            boxShadow: "0 8px 18px -8px oklch(0.35 0.08 52 / 0.55)",
            transition: `left 500ms ${EASE}, top 500ms ${EASE}`,
          }}
        />
        {draft.lat != null && draft.lng != null ? (
          <p className="absolute right-3 bottom-3 text-[12px] tabular-nums text-[oklch(0.42_0.03_55)]">
            {draft.lat.toFixed(4)}, {draft.lng.toFixed(4)}
          </p>
        ) : null}
      </div>

      <label htmlFor="place-search" className="mt-6 block text-[14px] leading-5" style={{ color: INK }}>
        Building, tower, or villa
      </label>
      <input
        id="place-search"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Marina Gate, Saba Tower, Jumeirah villa…"
        className="mt-1.5 h-12 w-full rounded-2xl border bg-[#F9F6F0] px-3.5 text-[16px] outline-none placeholder:text-[oklch(0.5_0.025_55)]"
        style={{ borderColor: GOLD, color: INK }}
      />

      {!drawer && hits.length > 0 ? (
        <ul className="mt-2 overflow-hidden rounded-2xl border" style={{ borderColor: GOLD }}>
          {hits.map((hit) => (
            <li key={hit.id} className="border-t first:border-t-0" style={{ borderColor: GOLD }}>
              <button
                type="button"
                onClick={() => openHit(hit)}
                className="flex w-full flex-col px-3.5 py-3 text-left"
              >
                <span className="text-[14px] font-semibold" style={{ color: INK }}>
                  {hit.building}
                </span>
                <span className="text-[12px] leading-4" style={{ color: MUTED }}>
                  {hit.community} · {hit.emirate}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : !drawer && query.trim().length > 1 ? (
        <button
          type="button"
          onClick={() => openHit(customGeocodeFromQuery(query))}
          className="mt-2 rounded-2xl border px-3.5 py-3 text-left text-[14px] leading-5"
          style={{
            borderColor: "oklch(0.48 0.12 52)",
            color: INK,
            background: "oklch(0.97 0.012 82)",
          }}
        >
          + Use ‘{query.trim()}’ as the building name
        </button>
      ) : null}

      {drawer ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Close address review"
            className="absolute inset-0 bg-[oklch(0.22_0.02_55/0.28)]"
            onClick={() => setDrawer(false)}
          />
          <form
            onSubmit={save}
            className="absolute inset-x-0 bottom-0 max-h-[min(88vh,40rem)] overflow-y-auto rounded-t-[1.75rem] border border-b-0 bg-[#F9F6F0] px-5 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-18px_40px_-18px_oklch(0.22_0.03_55/0.22)] motion-safe:animate-[address-drawer-up_640ms_cubic-bezier(0.19,1,0.22,1)_both]"
            style={{ borderColor: GOLD }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[oklch(0.86_0.02_75)]" />
            <h2
              className="font-[family-name:var(--font-display)] text-[20px] leading-7 font-semibold tracking-[-0.02em]"
              style={{ color: INK }}
            >
              Review the address
            </h2>
            <p className="mt-1 max-w-[42ch] text-[14px] leading-5" style={{ color: MUTED }}>
              Five fields. Edit anything the pin got wrong before we save it to your profile.
            </p>

            <Field
              id="emirate"
              label="Emirate"
              error={errors.emirate}
            >
              <select
                id="emirate"
                value={draft.emirate}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    emirate: event.target.value as Emirate,
                  }))
                }
                className="mt-1.5 h-12 w-full rounded-2xl border bg-[#F9F6F0] px-3.5 text-[16px] outline-none"
                style={{ borderColor: errors.emirate ? "oklch(0.62 0.1 40)" : GOLD, color: INK }}
              >
                {EMIRATES.map((emirate) => (
                  <option key={emirate} value={emirate}>
                    {emirate}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="community"
              label="Community / neighborhood"
              value={draft.community}
              error={errors.community}
              onChange={(community) => setDraft((current) => ({ ...current, community }))}
            />
            <Field
              id="street"
              label="Street / road"
              value={draft.street}
              error={errors.street}
              onChange={(street) => setDraft((current) => ({ ...current, street }))}
            />
            <Field
              id="unit"
              label="Villa / apartment / floor"
              value={draft.unit}
              error={errors.unit}
              onChange={(unit) => setDraft((current) => ({ ...current, unit }))}
            />
            <Field
              id="contact-mobile"
              label="Contact mobile / WhatsApp"
              value={draft.mobile}
              error={errors.mobile}
              onChange={(nextMobile) => setDraft((current) => ({ ...current, mobile: nextMobile }))}
            />

            <button
              type="submit"
              disabled={saving || pending}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.22_0.025_55)] text-[14px] font-semibold tracking-[-0.01em] text-[#F9F6F0] disabled:bg-[oklch(0.82_0.02_72)]"
              style={{ transitionTimingFunction: EASE }}
            >
              {saving || pending ? "Saving…" : "Save address"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  children,
}: {
  id: string;
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mt-4">
      <label htmlFor={id} className="block text-[14px] leading-5" style={{ color: INK }}>
        {label}
      </label>
      {children ?? (
        <input
          id={id}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className="mt-1.5 h-12 w-full rounded-2xl border bg-[#F9F6F0] px-3.5 text-[16px] outline-none"
          style={{
            borderColor: error ? "oklch(0.62 0.1 40)" : GOLD,
            color: INK,
          }}
        />
      )}
      {error ? (
        <p role="alert" className="mt-1.5 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
