"use client";

import { saveTastePreferences } from "@/app/actions/taste";
import { addToWaitlist } from "@/app/actions/waitlist";
import { AddressPin } from "@/components/onboarding/AddressPin";
import { PhoneGate } from "@/components/onboarding/PhoneGate";
import { TasteSelector } from "@/components/onboarding/TasteSelector";
import { WaitlistSuccess } from "@/components/onboarding/WaitlistSuccess";
import { WardrobeLoading } from "@/components/onboarding/WardrobeLoading";
import { WelcomeBoot } from "@/components/onboarding/WelcomeBoot";
import { isTeaser } from "@/lib/env";
import { saveProfile } from "@/lib/profile-store";
import { saveInitialTaste } from "@/lib/taste-store";
import type { TasteAestheticId } from "@/lib/taste";
import { saveWaitlist, waitlistEmailFromMobile } from "@/lib/waitlist-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Stage = "phone" | "waitlist" | "taste" | "address";

export function OnboardingFlow() {
  const router = useRouter();
  const teaser = isTeaser();
  const [booting, setBooting] = useState(true);
  const [wardrobe, setWardrobe] = useState(false);
  const [stage, setStage] = useState<Stage>("phone");
  const [mobile, setMobile] = useState("");
  const [pending, setPending] = useState(false);
  const [phoneError, setPhoneError] = useState<string | undefined>();

  const finishBoot = useCallback(() => setBooting(false), []);

  const afterPhone = useCallback(async (nextMobile: string) => {
    setMobile(nextMobile);
    saveProfile({ mobile: nextMobile });
    if (!teaser) {
      setStage("taste");
      return;
    }
    setPending(true);
    setPhoneError(undefined);
    const email = waitlistEmailFromMobile(nextMobile);
    saveWaitlist(email, nextMobile);
    const result = await addToWaitlist(email, nextMobile);
    setPending(false);
    if (!result.success && result.error === "unknown") {
      setPhoneError("Could not save this number. Try again.");
      return;
    }
    setStage("waitlist");
  }, [teaser]);

  const finishTaste = async (input: {
    brands: string[];
    aesthetics: TasteAestheticId[];
  }) => {
    saveInitialTaste([], input.brands, input.aesthetics);
    setWardrobe(true);
    await saveTastePreferences({
      brands: input.brands,
      aesthetics: input.aesthetics,
    });
  };

  const afterWardrobe = useCallback(() => {
    setWardrobe(false);
    setStage("address");
  }, []);

  return (
    <main className="flex min-h-dvh w-full justify-center overflow-x-clip bg-[#F9F6F0]">
      {booting ? <WelcomeBoot onDone={finishBoot} /> : null}
      {wardrobe ? <WardrobeLoading onDone={afterWardrobe} /> : null}

      <div className="flex min-h-dvh w-full max-w-[28rem] flex-col overflow-x-visible px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.15rem,env(safe-area-inset-top))]">
        {booting ? null : (
          <header className="flex items-center gap-3">
            {stage === "taste" || stage === "address" ? (
              <button
                type="button"
                onClick={() => setStage(stage === "address" ? "taste" : "phone")}
                className="grid size-10 shrink-0 place-items-center text-[#2A1A14]"
                aria-label="Back"
              >
                <BackIcon />
              </button>
            ) : (
              <Link
                href="/"
                className="grid size-10 shrink-0 place-items-center text-[#2A1A14]"
                aria-label="Back to home"
              >
                <BackIcon />
              </Link>
            )}
            <p className="font-[family-name:var(--font-typewriter)] text-[13px] leading-4 text-[#6B4A3A]">
              {stage === "phone" || stage === "waitlist"
                ? "Step 1 of 3"
                : stage === "taste"
                  ? "Step 2 of 3"
                  : "Step 3 of 3"}
            </p>
          </header>
        )}

        {booting ? null : stage === "phone" ? (
          <PhoneGate pending={pending} error={phoneError} onVerified={afterPhone} />
        ) : null}
        {stage === "waitlist" ? (
          <WaitlistSuccess mobile={mobile} onPreview={() => setStage("taste")} />
        ) : null}
        {stage === "taste" ? (
          <TasteSelector pending={pending} onContinue={finishTaste} />
        ) : null}
        {stage === "address" ? (
          <AddressPin
            mobile={mobile}
            pending={pending}
            onSaved={() => router.push("/app")}
          />
        ) : null}
      </div>
    </main>
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
