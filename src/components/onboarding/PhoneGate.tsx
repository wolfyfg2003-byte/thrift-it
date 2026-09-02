"use client";

import { TapedPanel } from "@/components/brand/WashiTape";
import {
  formatUaeMobile,
  isVerifiedMobile,
  localMobileDigits,
} from "@/lib/profile-store";
import { useEffect, useId, useRef, useState } from "react";

const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";
const GOLD = "#2A1A14";
const INK = "#2A1A14";
const MUTED = "#6B4A3A";

/** Testing: skip typing a 6-digit code; the pin panel still slides in. */
const SKIP_OTP = true;

export function PhoneGate({
  pending = false,
  error,
  onVerified,
}: {
  pending?: boolean;
  error?: string;
  onVerified: (mobile: string) => void;
}) {
  const phoneId = useId();
  const [mobileLocal, setMobileLocal] = useState("");
  const [phase, setPhase] = useState<"phone" | "otp">("phone");
  const [pin, setPin] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const skipTimer = useRef<number | null>(null);
  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);

  const mobile = formatUaeMobile(mobileLocal);
  const onOtp = phase === "otp";

  useEffect(() => {
    return () => {
      if (skipTimer.current != null) window.clearTimeout(skipTimer.current);
    };
  }, []);

  const requestCode = () => {
    if (!isVerifiedMobile(mobile)) {
      setFieldError("Enter a UAE mobile number after +971.");
      return;
    }
    setFieldError(null);
    setPhase("otp");
    setPin("");
    if (SKIP_OTP) {
      skipTimer.current = window.setTimeout(() => onVerified(mobile), 640);
      return;
    }
    window.setTimeout(() => pinRefs.current[0]?.focus(), 360);
  };

  useEffect(() => {
    if (SKIP_OTP || phase !== "otp" || pin.length !== 6) return;
    onVerified(mobile);
  }, [mobile, onVerified, phase, pin]);

  return (
    <div className="relative flex min-h-[70vh] w-full flex-1 items-center justify-center pb-2">
      <TapedPanel className="w-full px-5 pt-6 pb-5 motion-safe:animate-[glass-card-up_700ms_cubic-bezier(0.19,1,0.22,1)_both]">
        <div className="relative overflow-hidden">
          <div
            className="transition-transform duration-700"
            style={{
              transform: onOtp ? "translateX(-108%)" : "translateX(0)",
              transitionTimingFunction: EASE,
            }}
            inert={onOtp ? true : undefined}
          >
            <h1
              className="font-[family-name:var(--font-display)] text-[32px] leading-none font-semibold tracking-[-0.03em]"
              style={{ color: INK }}
            >
              Your number
            </h1>
            <p className="mt-3 max-w-[36ch] text-[16px] leading-6" style={{ color: MUTED }}>
              UAE mobiles only. We use this for delivery and WhatsApp, not a public listing.
            </p>

            <label htmlFor={phoneId} className="mt-7 block text-[14px] leading-5" style={{ color: INK }}>
              UAE phone
            </label>
            <div
              className="mt-1.5 flex h-12 items-center rounded-2xl border bg-[#F9F6F0]/80 px-3.5"
              style={{ borderColor: fieldError ? "oklch(0.62 0.1 40)" : GOLD }}
            >
              <span className="pr-3 text-[16px] tabular-nums" style={{ color: INK }}>
                +971
              </span>
              <input
                id={phoneId}
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="50 123 4567"
                value={mobileLocal}
                tabIndex={onOtp ? -1 : 0}
                onChange={(event) => {
                  setMobileLocal(event.target.value.replace(/[^\d\s]/g, "").slice(0, 11));
                  setFieldError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    requestCode();
                  }
                }}
                className="h-full w-full bg-transparent text-[16px] tabular-nums outline-none placeholder:text-[oklch(0.5_0.025_55)]"
                style={{ color: INK }}
              />
            </div>
            {fieldError || error ? (
              <p role="alert" className="mt-2 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
                {fieldError ?? error}
              </p>
            ) : null}

            <p className="mt-4 max-w-[42ch] text-[12px] leading-4" style={{ color: MUTED }}>
              By continuing, you agree to our 48-Hour Inspect-at-Home Escrow Policy.
            </p>

            <button
              type="button"
              disabled={pending}
              onClick={requestCode}
              className="mt-6 flex h-12 w-full items-center justify-center border border-[#2A1A14] bg-[#D8829D] text-[14px] font-semibold tracking-[-0.01em] text-[#2A1A14] shadow-[4px_4px_0_0_#2A1A14] disabled:bg-[#C9B8A4] disabled:text-[#6B4A3A] disabled:shadow-none"
              style={{ transitionTimingFunction: EASE }}
            >
              {pending ? "Saving…" : "Request Code"}
            </button>
          </div>

          <div
            className="absolute inset-0 overflow-y-auto transition-transform duration-700"
            style={{
              transform: onOtp ? "translateX(0)" : "translateX(120%)",
              opacity: onOtp ? 1 : 0,
              transitionTimingFunction: EASE,
            }}
            aria-hidden={!onOtp}
            inert={onOtp ? undefined : true}
          >
            <h2
              className="font-[family-name:var(--font-display)] text-[32px] leading-none font-semibold tracking-[-0.03em]"
              style={{ color: INK }}
            >
              Enter the code
            </h2>
            <p className="mt-3 max-w-[36ch] text-[16px] leading-6" style={{ color: MUTED }}>
              {SKIP_OTP
                ? `Sent to ${mobile}. Skipping verification for this test.`
                : `Six digits to ${mobile}.`}
            </p>
            <div className="mt-8 flex justify-between gap-2">
              {Array.from({ length: 6 }, (_, index) => (
                <input
                  key={index}
                  ref={(node) => {
                    pinRefs.current[index] = node;
                  }}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Digit ${index + 1}`}
                  value={pin[index] ?? ""}
                  disabled={SKIP_OTP || !onOtp}
                  tabIndex={onOtp ? 0 : -1}
                  onChange={(event) => {
                    const digit = event.target.value.replace(/\D/g, "").slice(-1);
                    const next = pin.split("");
                    next[index] = digit;
                    const joined = next.join("").slice(0, 6);
                    setPin(joined);
                    if (digit && index < 5) pinRefs.current[index + 1]?.focus();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && !pin[index] && index > 0) {
                      pinRefs.current[index - 1]?.focus();
                    }
                  }}
                  className="h-12 w-full min-w-0 rounded-xl border bg-[#F9F6F0]/80 text-center text-[20px] tabular-nums outline-none"
                  style={{ borderColor: GOLD, color: INK }}
                />
              ))}
            </div>
            {SKIP_OTP ? (
              <p className="mt-5 text-[12px] leading-4" style={{ color: MUTED }}>
                Opening the next step…
              </p>
            ) : (
              <button
                type="button"
                className="mt-6 text-[14px] leading-5 underline-offset-4 hover:underline"
                style={{ color: MUTED }}
                onClick={() => {
                  setPhase("phone");
                  setPin("");
                  setMobileLocal(localMobileDigits(mobile));
                }}
              >
                Use a different number
              </button>
            )}
          </div>
        </div>
      </TapedPanel>
    </div>
  );
}
