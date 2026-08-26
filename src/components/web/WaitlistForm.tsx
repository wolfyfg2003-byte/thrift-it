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

const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";
const LINE = "#2A1A14";

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
    if (variant === "drawer") return;
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
  }, [variant]);

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
    : "relative border border-[#2A1A14] bg-[#F4EFE6] px-5 py-6 shadow-[4px_4px_0_0_#2A1A14]";

  if (joined) {
    return (
      <div className={shell} role="status">
        <p className="font-[family-name:var(--font-typewriter)] text-[16px] text-[#2A1A14] lg:text-[20px]">
          You’re on the list. We’ll write when the closet opens.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={shell}>
      <div>
        <label
          htmlFor={emailId}
          className="block text-[14px] leading-5 text-[#2A1A14]"
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
          className="mt-1.5 h-12 w-full border bg-[#F9F6F0] px-4 text-[16px] text-[#2A1A14] outline-none focus:border-[#4B6584] disabled:opacity-60"
          style={{ borderColor: errors.email ? "#8B3A32" : LINE }}
        />
        {errors.email ? (
          <p className="mt-1.5 text-[14px] leading-5 text-[#8B3A32]">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <label
          htmlFor={mobileId}
          className="block text-[14px] leading-5 text-[#2A1A14]"
        >
          UAE mobile
        </label>
        <div
          className="mt-1.5 flex h-12 overflow-hidden border bg-[#F9F6F0]"
          style={{ borderColor: errors.mobile ? "#8B3A32" : LINE }}
        >
          <span className="grid place-items-center px-3 text-[14px] text-[#6B4A3A]">
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
            className="min-w-0 flex-1 bg-transparent pr-4 text-[16px] text-[#2A1A14] outline-none disabled:opacity-60"
          />
        </div>
        {errors.mobile ? (
          <p className="mt-1.5 text-[14px] leading-5 text-[#8B3A32]">
            {errors.mobile}
          </p>
        ) : null}
      </div>

      {formError === "already_registered" ? (
        <p
          className="mt-4 border border-[#2A1A14] bg-[rgba(241,196,15,0.8)] px-3 py-2 text-center font-[family-name:var(--font-handwritten)] text-[16px] leading-5 text-[#2A1A14]"
          role="status"
        >
          You’re already on the VIP list!
        </p>
      ) : null}
      {formError === "unknown" ? (
        <p className="mt-4 text-[14px] leading-5 text-[#8B3A32]" role="alert">
          Oops, something went wrong. Please try again.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={`${compact ? "mt-4" : "mt-6"} flex h-12 w-full items-center justify-center border border-[#2A1A14] bg-[#D8829D] text-[14px] font-semibold tracking-[-0.01em] text-[#2A1A14] shadow-[4px_4px_0_0_#2A1A14] disabled:opacity-70`}
        style={{ transitionTimingFunction: EASE }}
      >
        {isPending ? "Securing your spot..." : submitLabel}
      </button>
    </form>
  );
}
