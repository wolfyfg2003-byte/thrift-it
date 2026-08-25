"use client";

import { addToWaitlist } from "@/app/actions/waitlist";
import {
  formatUaeMobile,
  isVerifiedMobile,
  localMobileDigits,
} from "@/lib/profile-store";
import {
  isValidEmail,
  readWaitlist,
  saveWaitlist,
  type WaitlistEntry,
} from "@/lib/waitlist-store";
import { useEffect, useId, useState, useTransition, type FormEvent } from "react";

const EASE = "cubic-bezier(0.25, 1, 0.5, 1)";
const GOLD = "#E5D9C4";

type FieldErrors = {
  email?: string;
  mobile?: string;
};

type WaitlistFormProps = {
  variant?: "page" | "drawer";
  submitLabel?: string;
};

export function WaitlistForm({
  variant = "page",
  submitLabel = "Join the VIP waitlist",
}: WaitlistFormProps) {
  const emailId = useId();
  const mobileId = useId();
  const [email, setEmail] = useState("");
  const [mobileLocal, setMobileLocal] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [joined, setJoined] = useState<WaitlistEntry | null>(null);
  const [formError, setFormError] = useState<"already_registered" | "unknown" | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const sync = () => {
      const existing = readWaitlist();
      if (!existing) return;
      setJoined(existing);
      setEmail(existing.email);
      setMobileLocal(localMobileDigits(existing.mobile));
    };
    sync();
    window.addEventListener("thrift-waitlist", sync);
    return () => window.removeEventListener("thrift-waitlist", sync);
  }, []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const mobile = formatUaeMobile(mobileLocal);
    const next: FieldErrors = {};
    if (!isValidEmail(email)) {
      next.email = "Enter an email we can reach when the closet opens.";
    }
    if (!isVerifiedMobile(mobile)) {
      next.mobile = "Enter a UAE mobile number after +971.";
    }
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    startTransition(async () => {
      const result = await addToWaitlist(email, mobile);
      if (result.success) {
        setJoined(saveWaitlist(email, mobile));
        return;
      }
      setFormError(result.error);
    });
  };

  const compact = variant === "drawer";
  const shell = compact
    ? ""
    : "rounded-[1.5rem] border bg-[oklch(0.97_0.012_82)] px-5 py-6";

  if (joined) {
    return (
      <div
        className={shell}
        style={compact ? undefined : { borderColor: GOLD }}
        role="status"
      >
        <p className="font-figtree text-[16px] font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)] lg:text-[20px]">
          You’re on the list. We’ll write when the closet opens.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={shell}
      style={compact ? undefined : { borderColor: GOLD }}
    >
      <div>
        <label
          htmlFor={emailId}
          className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]"
        >
          Email
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          aria-invalid={errors.email ? true : undefined}
          disabled={isPending}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((prev) => ({ ...prev, email: undefined }));
            setFormError(null);
          }}
          className="mt-1.5 h-12 w-full rounded-2xl border bg-[#FDFBF7] px-4 text-[16px] text-[oklch(0.22_0.025_55)] outline-none focus:border-[oklch(0.48_0.12_52)] disabled:opacity-60"
          style={{ borderColor: errors.email ? "oklch(0.55 0.12 25)" : GOLD }}
        />
        {errors.email ? (
          <p className="mt-1.5 text-[14px] leading-5 text-[oklch(0.5_0.1_25)]">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <label
          htmlFor={mobileId}
          className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]"
        >
          UAE mobile
        </label>
        <div
          className="mt-1.5 flex h-12 overflow-hidden rounded-2xl border bg-[#FDFBF7]"
          style={{ borderColor: errors.mobile ? "oklch(0.55 0.12 25)" : GOLD }}
        >
          <span className="grid place-items-center px-3 text-[14px] text-[oklch(0.42_0.03_55)]">
            +971
          </span>
          <input
            id={mobileId}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={mobileLocal}
            aria-invalid={errors.mobile ? true : undefined}
            disabled={isPending}
            onChange={(event) => {
              setMobileLocal(event.target.value.replace(/\D/g, "").slice(0, 9));
              setErrors((prev) => ({ ...prev, mobile: undefined }));
              setFormError(null);
            }}
            placeholder="50 123 4567"
            className="min-w-0 flex-1 bg-transparent pr-4 text-[16px] text-[oklch(0.22_0.025_55)] outline-none disabled:opacity-60"
          />
        </div>
        {errors.mobile ? (
          <p className="mt-1.5 text-[14px] leading-5 text-[oklch(0.5_0.1_25)]">
            {errors.mobile}
          </p>
        ) : null}
      </div>

      {formError === "already_registered" ? (
        <p
          className="mt-4 rounded-full border px-3 py-2 text-center text-[14px] leading-5 font-semibold text-[oklch(0.48_0.12_52)]"
          style={{ borderColor: GOLD }}
          role="status"
        >
          You’re already on the VIP list!
        </p>
      ) : null}
      {formError === "unknown" ? (
        <p className="mt-4 text-[14px] leading-5 text-[oklch(0.5_0.1_25)]" role="alert">
          Oops, something went wrong. Please try again.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.22_0.025_55)] text-[14px] font-semibold tracking-[-0.01em] text-[#FDFBF7] transition-colors duration-200 hover:text-[oklch(0.82_0.1_78)] disabled:opacity-70"
        style={{ transitionTimingFunction: EASE }}
      >
        {isPending ? "Securing your spot..." : submitLabel}
      </button>
    </form>
  );
}
