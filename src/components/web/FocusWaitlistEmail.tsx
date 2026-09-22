"use client";

import type { ReactNode } from "react";
import { WAITLIST_EMAIL_ID } from "@/components/web/WaitlistForm";

type FocusWaitlistEmailProps = {
  className?: string;
  children: ReactNode;
};

export function FocusWaitlistEmail({ className, children }: FocusWaitlistEmailProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const input = document.getElementById(WAITLIST_EMAIL_ID);
        if (input instanceof HTMLInputElement) {
          input.focus();
        }
      }}
    >
      {children}
    </button>
  );
}
