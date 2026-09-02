"use client";

import AddressFields from "@/components/AddressFields";
import AppDock, { APP_DOCK_HEIGHT } from "@/components/AppDock";
import { SizeMatrix } from "@/components/SizeMatrix";
import {
  addApplePay,
  addMamoCard,
  formatUaeMobile,
  isVerifiedMobile,
  localMobileDigits,
  removeMamoCard,
  restoreProfile,
  saveProfile,
  setDefaultCard,
  useProfile,
  type MamoCard,
  type NotificationPrefs,
} from "@/lib/profile-store";
import {
  defaultDressSizeKey,
  formatSizeKeyLabel,
  sizeKeyToDressCode,
} from "@/lib/filters";
import {
  normalizeAddress,
  validateAddress,
  type AddressErrors,
  type UaeAddress,
} from "@/lib/uae-address";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type FieldErrors = AddressErrors & {
  name?: string;
  email?: string;
  mobile?: string;
};

export default function SettingsScreen() {
  const profile = useProfile();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [mobileLocal, setMobileLocal] = useState(localMobileDigits(profile.mobile));
  const [dressSizeKey, setDressSizeKey] = useState(
    profile.dressSizeKey || defaultDressSizeKey(profile.dressSizeCode),
  );
  const [address, setAddress] = useState<UaeAddress>(profile.address);
  const [notifications, setNotifications] = useState<NotificationPrefs>(
    profile.notifications,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);
  const [addingPay, setAddingPay] = useState(false);
  const savedTimer = useRef<number>(0);

  useEffect(() => {
    restoreProfile();
  }, []);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setMobileLocal(localMobileDigits(profile.mobile));
    setDressSizeKey(profile.dressSizeKey || defaultDressSizeKey(profile.dressSizeCode));
    setAddress(normalizeAddress(profile.address));
    setNotifications(profile.notifications);
  }, [profile.name, profile.email, profile.mobile, profile.dressSizeCode, profile.dressSizeKey, profile.address, profile.notifications]);

  useEffect(() => {
    return () => window.clearTimeout(savedTimer.current);
  }, []);

  const mobile = formatUaeMobile(mobileLocal);
  const verified = isVerifiedMobile(mobile);

  const onSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email.";
    }
    if (!isVerifiedMobile(mobile)) {
      nextErrors.mobile = "Enter a UAE mobile number after +971.";
    }
    Object.assign(nextErrors, validateAddress(address));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSaved(false);
      return;
    }
    saveProfile({
      name: name.trim(),
      email: email.trim(),
      mobile,
      dressSizeKey,
      dressSizeCode: sizeKeyToDressCode(dressSizeKey) ?? profile.dressSizeCode,
      address,
      notifications,
    });
    setSaved(true);
    window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSaved(false), 2400);
  };

  const hasApplePay = profile.cards.some((card) => card.brand === "Apple Pay");

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[28rem] bg-[#F9F6F0] px-5 pt-[max(0.85rem,env(safe-area-inset-top))] pb-[calc(8.75rem+env(safe-area-inset-bottom))]">
      <header>
        <Link
          href="/profile"
          className="inline-flex h-10 items-center text-[14px] font-semibold text-[oklch(0.22_0.025_55)]"
        >
          <BackIcon />
          <span className="ml-1">Back to Profile</span>
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[32px] leading-[1.15] tracking-[-0.03em] text-[oklch(0.22_0.025_55)]">
          Account Settings
        </h1>
        <p className="mt-3 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
          Demonstration profile — saved on this device for AJEX labels and Mamo
          Pay escrow.
        </p>
      </header>

      <form onSubmit={onSave} noValidate className="mt-9">
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-[20px] leading-7 tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
            Personal details
          </h2>
          <div className="mt-5 flex flex-col gap-5">
            <TextField
              id="settings-name"
              label="Full name"
              value={name}
              autoComplete="name"
              error={errors.name}
              onChange={(value) => {
                setName(value);
                setSaved(false);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
            />
            <TextField
              id="settings-email"
              label="Email address"
              type="email"
              value={email}
              autoComplete="email"
              error={errors.email}
              onChange={(value) => {
                setEmail(value);
                setSaved(false);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />
            <div>
              <label
                htmlFor="settings-mobile"
                className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]"
              >
                Verified UAE mobile
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[16px] tabular-nums text-[oklch(0.42_0.03_55)]">
                  +971
                </span>
                <input
                  id="settings-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  aria-invalid={errors.mobile ? true : undefined}
                  value={mobileLocal}
                  placeholder="50 432 1964"
                  onChange={(event) => {
                    setMobileLocal(event.target.value.replace(/\D/g, "").slice(0, 9));
                    setSaved(false);
                    setErrors((prev) => ({ ...prev, mobile: undefined }));
                  }}
                  className={`h-12 w-full rounded-2xl border bg-[#F9F6F0] py-0 pr-[7.25rem] pl-[3.65rem] text-[16px] tabular-nums text-[oklch(0.22_0.025_55)] outline-none placeholder:text-[oklch(0.5_0.025_55)] focus:border-[oklch(0.48_0.12_52)] ${
                    errors.mobile
                      ? "border-[oklch(0.62_0.1_40)]"
                      : "border-[oklch(0.88_0.018_80)]"
                  }`}
                />
                {verified ? (
                  <span className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 text-[12px] leading-4 font-semibold tracking-[0.02em] text-[oklch(0.36_0.08_52)]">
                    <VerifiedIcon />
                    Verified
                  </span>
                ) : null}
              </div>
              {errors.mobile ? (
                <p role="alert" className="mt-1.5 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
                  {errors.mobile}
                </p>
              ) : (
                <p className="mt-1.5 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
                  Country code is locked to +971. OTP from signup keeps this line verified.
                </p>
              )}
            </div>
            <div>
              <p id="settings-dress-size" className="text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
                Dress size
              </p>
              <div className="mt-2">
                <SizeMatrix
                  labelledBy="settings-dress-size"
                  mode="single"
                  surface="page"
                  selected={[dressSizeKey]}
                  onChange={(next) => {
                    const key = next[0];
                    if (!key) return;
                    setDressSizeKey(key);
                    setSaved(false);
                  }}
                />
              </div>
              <p className="mt-2 max-w-[42ch] text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
                {formatSizeKeyLabel(dressSizeKey)}. The deck leads with this size.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[1.35rem] border border-[oklch(0.86_0.02_80)] px-4 py-5">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] leading-7 tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
            UAE delivery address
          </h2>
          <p className="mt-2 max-w-[40ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
            Structured for AJEX: emirate, community, then the door the driver can find.
          </p>
          <div className="mt-5">
            <AddressFields
              idPrefix="settings"
              value={address}
              errors={errors}
              onChange={(next) => {
                setAddress(next);
                setSaved(false);
                setErrors({});
              }}
            />
          </div>
        </section>

        <section className="mt-10 rounded-[1.35rem] border border-[oklch(0.86_0.02_80)] px-4 py-5">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] leading-7 tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
            Payment cards
          </h2>
          <p className="mt-2 max-w-[40ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
            Mamo Pay tokens for escrow. Thrift It never stores the full number.
            Demonstration tokens — not billed.
          </p>
          {profile.cards.length === 0 ? (
            <p className="mt-5 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
              No card on file. Add Apple Pay or a Mamo Pay token to skip retyping at
              checkout.
            </p>
          ) : (
            <ul className="mt-5">
              {profile.cards.map((card) => (
                <li
                  key={card.token}
                  className="border-b border-[oklch(0.88_0.018_80)] py-4 last:border-b-0 last:pb-0"
                >
                  <CardRow card={card} />
                </li>
              ))}
            </ul>
          )}

          {addingPay ? (
            <div className="mt-4">
              {!hasApplePay ? (
                <button
                  type="button"
                  onClick={() => {
                    addApplePay();
                    setAddingPay(false);
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[oklch(0.84_0.02_75)] text-[14px] font-semibold text-[oklch(0.22_0.025_55)] transition-colors duration-200 hover:bg-[oklch(0.96_0.012_82)]"
                  style={{ transitionTimingFunction: EASE }}
                >
                  <ApplePayMark />
                  Tokenize Apple Pay
                </button>
              ) : null}
              <AddCardForm onCancel={() => setAddingPay(false)} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingPay(true)}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full border border-[oklch(0.84_0.02_75)] text-[14px] font-semibold text-[oklch(0.22_0.025_55)] transition-colors duration-200 hover:bg-[oklch(0.96_0.012_82)]"
              style={{ transitionTimingFunction: EASE }}
            >
              Add Apple Pay / New Card
            </button>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-[20px] leading-7 tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
            Notifications
          </h2>
          <p className="mt-2 max-w-[42ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
            Urgency on this device only. No WhatsApp, push, or email is sent in the demo.
          </p>
          <ul className="mt-5">
            <ToggleRow
              title="WhatsApp bargain alerts"
              body="High priority. New offers and seller counters land on WhatsApp first."
              checked={notifications.whatsappBargains}
              onChange={(whatsappBargains) => {
                setNotifications((prev) => ({ ...prev, whatsappBargains }));
                setSaved(false);
              }}
            />
            <ToggleRow
              title="In-app message pushes"
              body="Sound and vibrate when a thread needs you — offers, escrow, sold-out."
              checked={notifications.inAppMessages}
              onChange={(inAppMessages) => {
                setNotifications((prev) => ({ ...prev, inAppMessages }));
                setSaved(false);
              }}
            />
            <ToggleRow
              title="Email delivery tracking"
              body="AJEX waybills, pickup windows, and Mamo Pay receipts to your inbox."
              checked={notifications.emailTracking}
              onChange={(emailTracking) => {
                setNotifications((prev) => ({ ...prev, emailTracking }));
                setSaved(false);
              }}
            />
          </ul>
        </section>

        <div
          className="fixed inset-x-0 z-20 border-t border-[oklch(0.86_0.02_80)] bg-[#F9F6F0] px-5 pt-3"
          style={{ bottom: APP_DOCK_HEIGHT }}
        >
          <div className="mx-auto max-w-[28rem] pb-3">
            {saved ? (
              <p
                role="status"
                className="mb-3 rounded-full bg-[oklch(0.93_0.03_75)] px-4 py-2 text-center text-[12px] leading-4 font-semibold tracking-[0.02em] text-[oklch(0.32_0.06_52)] motion-safe:animate-[save-flash_2400ms_cubic-bezier(0.16,1,0.3,1)_both]"
              >
                Changes saved
              </p>
            ) : null}
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold tracking-[0.01em] text-[oklch(0.98_0.012_85)] transition-colors duration-200 hover:bg-[oklch(0.42_0.12_52)]"
              style={{ transitionTimingFunction: EASE }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </form>

      <AppDock />
    </main>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: "text" | "email";
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
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

function CardRow({ card }: { card: MamoCard }) {
  const title =
    card.brand === "Apple Pay" ? "Apple Pay" : `${card.brand}  ••••  ${card.last4}`;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 grid h-10 w-14 shrink-0 place-items-center rounded-[0.65rem] border border-[oklch(0.86_0.02_80)] bg-[oklch(0.97_0.008_82)] text-[oklch(0.32_0.05_52)]">
          {card.brand === "Apple Pay" ? (
            <ApplePayMark />
          ) : card.brand === "Mastercard" ? (
            <MastercardMark />
          ) : (
            <VisaMark />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)] tabular-nums">
            {title}
          </p>
          <p className="mt-1 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
            {card.brand === "Apple Pay"
              ? "Mamo Pay wallet token"
              : `Exp ${card.expMonth}/${card.expYear}`}
          </p>
          {card.isDefault ? (
            <p className="mt-2 inline-block rounded-full bg-[oklch(0.93_0.02_72)] px-2.5 py-[3px] text-[12px] leading-4 text-[oklch(0.32_0.06_52)]">
              Default for escrow
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setDefaultCard(card.token)}
              className="mt-2 text-[14px] font-semibold text-[oklch(0.22_0.025_55)] underline decoration-[oklch(0.48_0.12_52)] underline-offset-2"
            >
              Use as default
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => removeMamoCard(card.token)}
        className="shrink-0 text-[14px] font-semibold text-[oklch(0.42_0.03_55)]"
      >
        Remove
      </button>
    </div>
  );
}

function AddCardForm({ onCancel }: { onCancel: () => void }) {
  const [brand, setBrand] = useState<Exclude<MamoCard["brand"], "Apple Pay">>("Visa");
  const [last4, setLast4] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!/^\d{4}$/.test(last4)) {
      setError("Enter the last four digits only. Mamo Pay keeps the rest.");
      return;
    }
    if (!/^(0[1-9]|1[0-2])$/.test(expMonth) || !/^\d{2}$/.test(expYear)) {
      setError("Use a valid expiry, MM and YY.");
      return;
    }
    addMamoCard({ brand, last4, expMonth, expYear });
    onCancel();
  };

  return (
    <div className="mt-4">
      <p className="text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
        Tokenize a card
      </p>
      <p className="mt-1 max-w-[36ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
        Simulated. Mamo Pay returns a token; we never store the PAN.
      </p>
      <label htmlFor="card-brand" className="mt-5 block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
        Brand
      </label>
      <div className="relative mt-1.5">
        <select
          id="card-brand"
          value={brand}
          onChange={(event) =>
            setBrand(event.target.value as Exclude<MamoCard["brand"], "Apple Pay">)
          }
          className="h-12 w-full appearance-none rounded-2xl border border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] px-3.5 pr-10 text-[16px] text-[oklch(0.22_0.025_55)] outline-none focus:border-[oklch(0.48_0.12_52)]"
        >
          <option value="Visa">Visa</option>
          <option value="Mastercard">Mastercard</option>
        </select>
        <Chevron className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[oklch(0.42_0.03_55)]" />
      </div>
      <label htmlFor="card-last4" className="mt-4 block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
        Last four digits
      </label>
      <input
        id="card-last4"
        inputMode="numeric"
        value={last4}
        maxLength={4}
        placeholder="4321"
        onChange={(event) => {
          setLast4(event.target.value.replace(/\D/g, "").slice(0, 4));
          setError(null);
        }}
        className="mt-1.5 h-12 w-full rounded-2xl border border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] px-3.5 text-[16px] tabular-nums text-[oklch(0.22_0.025_55)] outline-none placeholder:text-[oklch(0.5_0.025_55)] focus:border-[oklch(0.48_0.12_52)]"
      />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="card-mm" className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
            Expiry month
          </label>
          <input
            id="card-mm"
            inputMode="numeric"
            value={expMonth}
            placeholder="08"
            onChange={(event) => setExpMonth(event.target.value.replace(/\D/g, "").slice(0, 2))}
            className="mt-1.5 h-12 w-full rounded-2xl border border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] px-3.5 text-[16px] tabular-nums text-[oklch(0.22_0.025_55)] outline-none placeholder:text-[oklch(0.5_0.025_55)] focus:border-[oklch(0.48_0.12_52)]"
          />
        </div>
        <div>
          <label htmlFor="card-yy" className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
            Expiry year
          </label>
          <input
            id="card-yy"
            inputMode="numeric"
            value={expYear}
            placeholder="28"
            onChange={(event) => setExpYear(event.target.value.replace(/\D/g, "").slice(0, 2))}
            className="mt-1.5 h-12 w-full rounded-2xl border border-[oklch(0.88_0.018_80)] bg-[#F9F6F0] px-3.5 text-[16px] tabular-nums text-[oklch(0.22_0.025_55)] outline-none placeholder:text-[oklch(0.5_0.025_55)] focus:border-[oklch(0.48_0.12_52)]"
          />
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={submit}
        className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.98_0.012_85)]"
      >
        Save token
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="mt-2 flex h-12 w-full items-center justify-center rounded-full text-[14px] font-semibold text-[oklch(0.22_0.025_55)]"
      >
        Cancel
      </button>
    </div>
  );
}

function ToggleRow({
  title,
  body,
  checked,
  onChange,
}: {
  title: string;
  body: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <li className="flex items-start justify-between gap-4 border-b border-[oklch(0.88_0.018_80)] py-5 last:border-b-0">
      <div className="min-w-0 max-w-[28ch]">
        <p className="text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
          {title}
        </p>
        <p className="mt-1 text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">{body}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-[oklch(0.48_0.12_52)]" : "bg-[oklch(0.88_0.018_80)]"
        }`}
        style={{ transitionTimingFunction: EASE }}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-[oklch(0.98_0.012_85)] shadow-[0_4px_10px_-4px_oklch(0.22_0.03_55/0.45)] transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
          style={{ transitionTimingFunction: EASE }}
        />
      </button>
    </li>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M11.5 3.5 5.5 9l6 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5.1" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M3.4 6.15 5.15 7.85 8.6 4.3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VisaMark() {
  return (
    <svg width="36" height="12" viewBox="0 0 36 12" fill="none" aria-hidden="true">
      <path
        d="M13.4 1.2h2.35l-2.6 9.6H10.8l2.6-9.6Zm10.05 6.2c0-2.55-3.5-2.7-3.48-3.85 0-.35.34-.73 1.08-.83.36-.05 1.37-.09 2.5.47l.45-2.08A6.6 6.6 0 0 0 21.7 1c-2.52 0-4.29 1.34-4.31 3.26-.03 1.42 1.26 2.21 2.22 2.68.99.49 1.32.8 1.32 1.23-.01.67-.8.97-1.54.98-1.3.02-2.05-.35-2.65-.63l-.47 2.18c.61.28 1.74.53 2.91.54 2.75 0 4.55-1.32 4.57-3.37ZM7.9 1.2 3.55 10.8H1.1L-1.05 3.4c-.13-.5-.24-.69-.64-.9C-2.32 2.16-3.5 1.8-3.5 1.8h3.9c.5 0 .95.33 1.06.9l.97 5.15 2.4-6.05H7.9Zm19.55 9.6h2.2l-1.93-9.6h-1.9c-.44 0-.81.26-.98.66L20.7 10.8h2.47l.34-1h3.02l.2 1Zm-2.62-2.85.93-2.7.54 2.7h-1.47Z"
        fill="currentColor"
        transform="translate(4 0)"
      />
    </svg>
  );
}

function MastercardMark() {
  return (
    <svg width="28" height="16" viewBox="0 0 28 16" fill="none" aria-hidden="true">
      <circle cx="11" cy="8" r="6" fill="oklch(0.55 0.12 45 / 0.85)" />
      <circle cx="17" cy="8" r="6" fill="oklch(0.48 0.12 52 / 0.72)" />
    </svg>
  );
}

function ApplePayMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M11.4 8.15c0-1.7 1.38-2.52 1.44-2.55-1.05-1.54-2.68-1.75-3.22-1.76-1.35-.14-2.65.8-3.34.8-.7 0-1.76-.79-2.9-.76-1.47.02-2.84.87-3.59 2.2-1.55 2.7-.4 6.68 1.1 8.87.74 1.07 1.61 2.26 2.75 2.22 1.11-.05 1.53-.72 2.87-.72 1.33 0 1.71.72 2.9.69 1.2-.02 1.96-1.08 2.69-2.16.85-1.23 1.2-2.43 1.21-2.49-.03-.01-2.32-.89-2.32-3.54ZM9.7 2.86c.6-.74 1.01-1.77.9-2.8-.87.04-1.94.59-2.56 1.32-.56.65-1.05 1.72-.92 2.72.98.08 1.98-.5 2.58-1.24Z"
        fill="currentColor"
        transform="translate(2.2 0.2)"
      />
    </svg>
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
