"use client";

import { addToWaitlist } from "@/app/actions/waitlist";
import { trackWaitlist } from "@/lib/analytics";
import { localePage, type Dictionary } from "@/lib/i18n";
import {
  isValidEmail,
  saveWaitlist,
} from "@/lib/waitlist-store";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";

const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";
const LINE = "#2A1A14";
const ERROR = "#8B3A32";

export const WAITLIST_EMAIL_ID = "waitlist-email";

type WaitlistFormProps = {
  variant?: "page" | "drawer";
  t: Dictionary;
};

export function WaitlistForm({ variant = "page", t }: WaitlistFormProps) {
  const generatedId = useId();
  const fieldId = variant === "page" ? WAITLIST_EMAIL_ID : generatedId;
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const emailRef = useRef("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [flash, setFlash] = useState(false);
  const [formError, setFormError] = useState<"already_registered" | "unknown" | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  emailRef.current = email;

  useEffect(() => {
    const button = buttonRef.current;
    const input = inputRef.current;
    if (!button || !input) return;

    const onClick = () => {
      if (isValidEmail(emailRef.current)) return;
      input.focus();
      setEmailError(t.form.emailError);
      setFormError(null);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 400);
      try {
        navigator.vibrate?.(40);
      } catch {
        /* Instagram and desktop ignore vibrate. */
      }
    };

    button.addEventListener("click", onClick);
    return () => button.removeEventListener("click", onClick);
  }, [t.form.emailError]);

  const join = () => {
    const value = emailRef.current;
    if (!isValidEmail(value)) return;
    setEmailError(undefined);
    setFormError(null);

    startTransition(async () => {
      const result = await addToWaitlist(value);
      const welcome = localePage(
        document.documentElement.lang.startsWith("ar") ? "ar" : "en",
        "welcome",
      );
      if (result.success) {
        trackWaitlist("join", variant, result.eventId);
        saveWaitlist(value);
        router.push(welcome);
        return;
      }
      if (result.error === "already_registered") {
        trackWaitlist("already", variant);
        saveWaitlist(value);
        router.push(welcome);
        return;
      }
      setFormError(result.error);
    });
  };

  const compact = variant === "drawer";
  const ink = emailError ? ERROR : LINE;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        join();
      }}
      noValidate
    >
      <div>
        <label
          htmlFor={fieldId}
          className="block text-[14px] leading-5 text-[#2A1A14]"
        >
          {t.form.email}
        </label>
        <input
          ref={inputRef}
          id={fieldId}
          name="email"
          type="text"
          dir="ltr"
          autoComplete="email"
          inputMode="email"
          enterKeyHint="go"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={t.form.emailPlaceholder}
          value={email}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? `${fieldId}-error` : undefined}
          disabled={isPending}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(undefined);
            setFormError(null);
          }}
          data-clarity-mask="true"
          className={`mt-1.5 h-12 w-full border bg-[#F9F6F0] px-4 text-[16px] text-[#2A1A14] outline-none placeholder:text-[#6B4A3A] focus:border-[#4B6584] disabled:opacity-60 ${flash ? "waitlist-flash" : ""}`}
          style={{ borderColor: ink }}
        />
        {emailError ? (
          <p
            id={`${fieldId}-error`}
            className="mt-1.5 text-[14px] leading-5 text-[#8B3A32]"
            role="alert"
          >
            {emailError}
          </p>
        ) : null}
        <button
          ref={buttonRef}
          type={isValidEmail(email) ? "submit" : "button"}
          disabled={isPending}
          className={`${compact ? "mt-3 h-12" : "mt-4 h-14"} flex w-full items-center justify-center border border-[#2A1A14] bg-[#2A1A14] text-[16px] font-semibold tracking-[-0.01em] text-[#F4EFE6] shadow-[4px_4px_0_0_#D8829D] disabled:opacity-70`}
          style={{ transitionTimingFunction: EASE }}
        >
          {isPending ? t.form.pending : t.form.submit}
        </button>
      </div>

      {formError === "already_registered" ? (
        <p
          className="mt-4 border border-[#2A1A14] bg-[rgba(241,196,15,0.8)] px-3 py-2 text-center font-[family-name:var(--font-handwritten)] text-[16px] leading-5 text-[#2A1A14]"
          role="status"
        >
          {t.form.already}
        </p>
      ) : null}
      {formError === "unknown" ? (
        <p className="mt-4 text-[14px] leading-5 text-[#8B3A32]" role="alert">
          {t.form.unknown}
        </p>
      ) : null}

      <p className="mt-2.5 text-[12px] leading-4 text-[#6B4A3A]">
        {t.form.hint}
      </p>
    </form>
  );
}
