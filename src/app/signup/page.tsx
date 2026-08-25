"use client";

import AddressFields from "@/components/AddressFields";
import { restoreProfile, saveProfile } from "@/lib/profile-store";
import {
  EMPTY_ADDRESS,
  validateAddress,
  type AddressErrors,
  type UaeAddress,
} from "@/lib/uae-address";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const STEPS = 4;

type Intent = "buy" | "sell" | "";

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  mobile?: string;
  otp?: string;
  intent?: string;
  legal?: string;
} & AddressErrors;

export default function SignupPage() {
  const router = useRouter();
  const legalId = useId();
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [otpPhase, setOtpPhase] = useState<"idle" | "sending" | "entry">("idle");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [address, setAddress] = useState<UaeAddress>(EMPTY_ADDRESS);
  const [intent, setIntent] = useState<Intent>("");
  const [legal, setLegal] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    restoreProfile();
  }, []);

  useEffect(() => {
    if (otpPhase === "entry") {
      queueMicrotask(() => otpRefs.current[0]?.focus());
    }
  }, [otpPhase]);

  const sendOtp = () => {
    const digits = mobile.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 9) {
      setErrors((prev) => ({
        ...prev,
        mobile: "Enter a UAE mobile number after +971.",
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, mobile: undefined, otp: undefined }));
    setOtpPhase("sending");
    window.setTimeout(() => {
      setOtp(["", "", "", ""]);
      setOtpPhase("entry");
    }, 700);
  };

  const setOtpDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setOtp((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    if (digit && index < 3) otpRefs.current[index + 1]?.focus();
  };

  const onOtpKey = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const onOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    const next = ["", "", "", ""];
    pasted.split("").forEach((digit, index) => {
      next[index] = digit;
    });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 3)]?.focus();
  };

  const validateStep = (current: number): Errors => {
    const next: Errors = {};
    if (current === 1) {
      if (!name.trim()) next.name = "Enter your full name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        next.email = "Enter a valid email.";
      }
      if (password.length < 8) next.password = "Use at least 8 characters.";
    }
    if (current === 2) {
      const digits = mobile.replace(/\D/g, "");
      if (digits.length < 8 || digits.length > 9) {
        next.mobile = "Enter a UAE mobile number after +971.";
      }
      if (otpPhase !== "entry" || otp.join("").length !== 4) {
        next.otp = "Verify with the 4-digit SMS code.";
      }
    }
    if (current === 3) {
      Object.assign(next, validateAddress(address));
    }
    if (current === 4) {
      if (!intent) next.intent = "Choose whether you want to buy or sell.";
      if (!legal) {
        next.legal = "Confirm you are 18 or older and agree to the terms.";
      }
    }
    return next;
  };

  const goNext = () => {
    const nextErrors = validateStep(step);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setStep((current) => Math.min(STEPS, current + 1));
  };

  const goBack = () => setStep((current) => Math.max(1, current - 1));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < STEPS) {
      goNext();
      return;
    }
    const nextErrors = validateStep(4);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    saveProfile({
      name: name.trim(),
      email: email.trim(),
      mobile: `+971 ${mobile.trim()}`,
      address,
    });
    window.setTimeout(() => {
      router.push(intent === "sell" ? "/sell" : "/");
    }, 220);
  };

  const titles: Record<number, { heading: string; body: string }> = {
    1: {
      heading: "Open an account",
      body: "Your name, email, and a password. No classifieds. No meetups.",
    },
    2: {
      heading: "UAE mobile",
      body: "We send a one-time code so the wardrobe — and the escrow — stay real.",
    },
    3: {
      heading: "Delivery address",
      body: "AJEX collects and delivers at home. A precise UAE address keeps the driver out of the lobby guesswork.",
    },
    4: {
      heading: "How will you use Thrift It?",
      body: "You can do both later. This just sets your first home screen.",
    },
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[28rem] flex-col bg-[#FDFBF7] px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[max(1.15rem,env(safe-area-inset-top))]">
      <header>
        <div className="flex items-center gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="grid size-10 shrink-0 place-items-center text-[oklch(0.22_0.025_55)]"
              aria-label="Back"
            >
              <BackIcon />
            </button>
          ) : (
            <Link
              href="/"
              className="grid size-10 shrink-0 place-items-center text-[oklch(0.22_0.025_55)]"
              aria-label="Back to home"
            >
              <BackIcon />
            </Link>
          )}
          <p className="text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
            Step {step} of {STEPS}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-1.5" aria-hidden="true">
          {Array.from({ length: STEPS }, (_, index) => (
            <span
              key={index}
              className={`h-0.5 rounded-full transition-colors duration-200 ${
                index < step ? "bg-[oklch(0.48_0.12_52)]" : "bg-[oklch(0.88_0.018_80)]"
              }`}
              style={{ transitionTimingFunction: EASE }}
            />
          ))}
        </div>
        <h1
          key={step}
          className="mt-7 font-[family-name:var(--font-bodoni)] text-[32px] leading-none tracking-[-0.03em] text-[oklch(0.22_0.025_55)] motion-safe:animate-[step-in_220ms_cubic-bezier(0.16,1,0.3,1)_both]"
        >
          {titles[step].heading}
        </h1>
        <p className="mt-3 max-w-[40ch] text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
          {titles[step].body}
        </p>
      </header>

      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-1 flex-col">
        <div
          key={step}
          className="motion-safe:animate-[step-in_220ms_cubic-bezier(0.16,1,0.3,1)_both]"
        >
          {step === 1 ? (
            <div className="flex flex-col gap-5">
              <Field
                id="full-name"
                label="Full name"
                autoComplete="name"
                value={name}
                error={errors.name}
                onChange={(value) => {
                  setName(value);
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
              />
              <Field
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                error={errors.email}
                onChange={(value) => {
                  setEmail(value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
              />
              <Field
                id="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                value={password}
                error={errors.password}
                onChange={(value) => {
                  setPassword(value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <label htmlFor="mobile" className="block text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
                Mobile number
              </label>
              <div
                className={`mt-1.5 flex h-12 items-center rounded-2xl border bg-[#FDFBF7] px-3.5 ${
                  errors.mobile ? "border-[oklch(0.62_0.1_40)]" : "border-[oklch(0.88_0.018_80)]"
                } focus-within:border-[oklch(0.48_0.12_52)]`}
              >
                <span className="pr-3 text-[16px] tabular-nums text-[oklch(0.22_0.025_55)]">
                  +971
                </span>
                <input
                  id="mobile"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="50 123 4567"
                  value={mobile}
                  onChange={(event) => {
                    setMobile(event.target.value.replace(/[^\d\s]/g, "").slice(0, 11));
                    setErrors((prev) => ({ ...prev, mobile: undefined }));
                  }}
                  className="h-full w-full bg-transparent text-[16px] tabular-nums text-[oklch(0.22_0.025_55)] outline-none placeholder:text-[oklch(0.5_0.025_55)]"
                />
              </div>
              {errors.mobile ? (
                <p role="alert" className="mt-1.5 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
                  {errors.mobile}
                </p>
              ) : (
                <p className="mt-1.5 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
                  UAE numbers only. Simulated SMS — no message is sent.
                </p>
              )}

              {otpPhase === "idle" ? (
                <button
                  type="button"
                  onClick={sendOtp}
                  className="mt-6 flex h-12 w-full items-center justify-center rounded-full border border-[oklch(0.48_0.12_52)] text-[14px] font-semibold text-[oklch(0.22_0.025_55)] transition-colors duration-200 hover:bg-[oklch(0.96_0.012_82)]"
                  style={{ transitionTimingFunction: EASE }}
                >
                  Verify via SMS OTP
                </button>
              ) : null}

              {otpPhase === "sending" ? (
                <p
                  className="mt-8 font-[family-name:var(--font-bodoni)] text-[20px] leading-7 text-[oklch(0.22_0.025_55)] motion-safe:animate-[otp-send_700ms_cubic-bezier(0.16,1,0.3,1)_both]"
                  aria-live="polite"
                >
                  Sending code to +971 {mobile || "…"}
                </p>
              ) : null}

              {otpPhase === "entry" ? (
                <div className="mt-8 motion-safe:animate-[step-in_220ms_cubic-bezier(0.16,1,0.3,1)_both]">
                  <p className="text-[14px] leading-5 text-[oklch(0.22_0.025_55)]">
                    Enter the 4-digit code
                  </p>
                  <div className="mt-3 flex gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(node) => {
                          otpRefs.current[index] = node;
                        }}
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        aria-label={`Digit ${index + 1}`}
                        value={digit}
                        onChange={(event) => setOtpDigit(index, event.target.value)}
                        onKeyDown={(event) => onOtpKey(index, event)}
                        onPaste={onOtpPaste}
                        className="h-14 w-full rounded-2xl border border-[oklch(0.88_0.018_80)] bg-[#FDFBF7] text-center font-[family-name:var(--font-bodoni)] text-[32px] leading-none text-[oklch(0.22_0.025_55)] tabular-nums outline-none focus:border-[oklch(0.48_0.12_52)]"
                      />
                    ))}
                  </div>
                  {errors.otp ? (
                    <p role="alert" className="mt-2 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
                      {errors.otp}
                    </p>
                  ) : (
                    <p className="mt-2 text-[12px] leading-4 text-[oklch(0.42_0.03_55)]">
                      Any 4 digits complete this demo.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={sendOtp}
                    className="mt-4 text-[14px] font-semibold text-[oklch(0.22_0.025_55)] underline decoration-[oklch(0.48_0.12_52)] underline-offset-2"
                  >
                    Resend code
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <AddressFields
              idPrefix="signup"
              value={address}
              errors={errors}
              onChange={(next) => {
                setAddress(next);
                setErrors((prev) => ({
                  ...prev,
                  community: undefined,
                  building: undefined,
                  unit: undefined,
                  street: undefined,
                }));
              }}
            />
          ) : null}

          {step === 4 ? (
            <div>
              <div role="radiogroup" aria-label="Account intent" className="flex flex-col gap-3">
                <IntentCard
                  selected={intent === "buy"}
                  title="I want to Buy"
                  body="Shop verified contemporary pieces. Pay into escrow. Inspect for 12 hours after AJEX delivery."
                  onSelect={() => {
                    setIntent("buy");
                    setErrors((prev) => ({ ...prev, intent: undefined }));
                  }}
                />
                <IntentCard
                  selected={intent === "sell"}
                  title="I want to Sell"
                  body="Self-list at 0% seller commission, or request VIP Closet Detox."
                  onSelect={() => {
                    setIntent("sell");
                    setErrors((prev) => ({ ...prev, intent: undefined }));
                  }}
                />
              </div>
              {errors.intent ? (
                <p role="alert" className="mt-3 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
                  {errors.intent}
                </p>
              ) : null}

              <label
                htmlFor={legalId}
                className="mt-8 flex cursor-pointer items-start gap-3.5"
              >
                <input
                  id={legalId}
                  type="checkbox"
                  checked={legal}
                  onChange={(event) => {
                    setLegal(event.target.checked);
                    setErrors((prev) => ({ ...prev, legal: undefined }));
                  }}
                  className="mt-1 size-[1.15rem] shrink-0 accent-[oklch(0.48_0.12_52)]"
                />
                <span className="min-w-0 text-[14px] leading-5 text-[oklch(0.38_0.03_55)]">
                  I agree to Thrift It’s Terms of Service and confirm I am 18 or
                  older. Buyers: funds stay in escrow for 12 hours after delivery
                  so you can inspect fit and authenticity.
                </span>
              </label>
              {errors.legal ? (
                <p role="alert" className="mt-2 text-[14px] leading-5 text-[oklch(0.42_0.1_40)]">
                  {errors.legal}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[oklch(0.88_0.018_80)] bg-[#FDFBF7] px-5 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-[28rem]">
            <button
              type="submit"
              disabled={saving || (step === 2 && otpPhase === "sending")}
              className="flex h-12 w-full items-center justify-center rounded-full bg-[oklch(0.48_0.12_52)] text-[14px] font-semibold tracking-[-0.01em] text-[oklch(0.98_0.012_85)] transition-colors duration-200 hover:bg-[oklch(0.42_0.12_52)] active:bg-[oklch(0.38_0.11_52)] disabled:bg-[oklch(0.82_0.02_72)] disabled:text-[oklch(0.5_0.02_55)]"
              style={{ transitionTimingFunction: EASE }}
            >
              {saving ? "Opening Thrift It…" : step === STEPS ? "Create account" : "Continue"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

function IntentCard({
  selected,
  title,
  body,
  onSelect,
}: {
  selected: boolean;
  title: string;
  body: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`rounded-[1.35rem] px-4 py-5 text-left transition-colors duration-200 ${
        selected
          ? "bg-[oklch(0.945_0.02_72)]"
          : "bg-[oklch(0.96_0.01_82)]"
      }`}
      style={{ transitionTimingFunction: EASE }}
    >
      <span className="block font-[family-name:var(--font-bodoni)] text-[20px] leading-7 tracking-[-0.02em] text-[oklch(0.22_0.025_55)]">
        {title}
      </span>
      <span className="mt-3 block max-w-[36ch] text-[14px] leading-5 text-[oklch(0.42_0.03_55)]">
        {body}
      </span>
    </button>
  );
}

function Field({
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
  type?: "text" | "email" | "password";
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
        className={`mt-1.5 h-12 w-full rounded-2xl border bg-[#FDFBF7] px-3.5 text-[16px] text-[oklch(0.22_0.025_55)] outline-none placeholder:text-[oklch(0.5_0.025_55)] focus:border-[oklch(0.48_0.12_52)] ${
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
