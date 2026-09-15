"use client";

import { addToWaitlist } from "@/app/actions/waitlist";
import { trackWaitlist } from "@/lib/analytics";
import type { Dictionary } from "@/lib/i18n";
import {
  isValidEmail,
  saveWaitlist,
  type WaitlistEntry,
} from "@/lib/waitlist-store";
import { useId, useState, useTransition, type FormEvent } from "react";

const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";
const LINE = "#2A1A14";

type WaitlistFormProps = {
  variant?: "page" | "drawer";
  t: Dictionary;
};

export function WaitlistForm({ variant = "page", t }: WaitlistFormProps) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [joined, setJoined] = useState<WaitlistEntry | null>(null);
  const [formError, setFormError] = useState<"already_registered" | "unknown" | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setEmailError(t.form.emailError);
      setFormError(null);
      return;
    }
    setEmailError(undefined);
    setFormError(null);

    startTransition(async () => {
      const result = await addToWaitlist(email);
      if (result.success) {
        trackWaitlist("join", variant, result.eventId);
        setJoined(saveWaitlist(email));
        return;
      }
      if (result.error === "already_registered") {
        trackWaitlist("already", variant);
      }
      setFormError(result.error);
    });
  };

  const compact = variant === "drawer";

  return (
    <form onSubmit={onSubmit} noValidate>
      {joined ? (
        <p
          className="mb-4 font-[family-name:var(--font-typewriter)] text-[16px] text-[#2A1A14] lg:text-[20px]"
          role="status"
        >
          {t.form.joined}
        </p>
      ) : null}
      <div>
        <label
          htmlFor={emailId}
          className="block text-[14px] leading-5 text-[#2A1A14]"
        >
          {t.form.email}
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          inputMode="email"
          enterKeyHint="go"
          placeholder={t.form.emailPlaceholder}
          value={email}
          aria-invalid={emailError ? true : undefined}
          disabled={isPending}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(undefined);
            setFormError(null);
          }}
          className="mt-1.5 h-12 w-full border bg-[#F9F6F0] px-4 text-[16px] text-[#2A1A14] outline-none placeholder:text-[#6B4A3A] focus:border-[#4B6584] disabled:opacity-60"
          style={{ borderColor: emailError ? "#8B3A32" : LINE }}
        />
        {emailError ? (
          <p className="mt-1.5 text-[14px] leading-5 text-[#8B3A32]">
            {emailError}
          </p>
        ) : null}
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

      <button
        type="submit"
        disabled={isPending}
        className={`${compact ? "mt-3 h-12" : "mt-4 h-14"} flex w-full items-center justify-center border border-[#2A1A14] bg-[#2A1A14] text-[16px] font-semibold tracking-[-0.01em] text-[#F4EFE6] shadow-[4px_4px_0_0_#D8829D] disabled:opacity-70`}
        style={{ transitionTimingFunction: EASE }}
      >
        {isPending ? t.form.pending : t.form.submit}
      </button>
      {!joined ? (
        <p className="mt-2.5 text-[12px] leading-4 text-[#6B4A3A]">
          {t.form.hint}
        </p>
      ) : null}
    </form>
  );
}
