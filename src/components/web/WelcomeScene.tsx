"use client";

import { WashiTape } from "@/components/brand/WashiTape";
import { trackInstagramFollow } from "@/lib/analytics";
import type { Dictionary } from "@/lib/i18n";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

const EXPO = "expo.out";
export const INSTAGRAM_URL = "https://www.instagram.com/thriftitae/";

type WelcomeSceneProps = {
  t: Dictionary;
};

export function WelcomeScene({ t }: WelcomeSceneProps) {
  const root = useRef<HTMLElement>(null);
  const copy = t.welcome;

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      const timeline = gsap.timeline({ defaults: { ease: EXPO } });
      timeline
        .from(".welcome-tape", {
          y: -28,
          autoAlpha: 0,
          duration: 0.55,
          stagger: 0.08,
        })
        .from(
          "[data-welcome-polaroid]",
          {
            y: 56,
            rotation: 14,
            autoAlpha: 0,
            duration: 0.72,
          },
          "-=0.28",
        )
        .from(
          "[data-welcome-stamp]",
          {
            scale: 1.42,
            rotation: -22,
            autoAlpha: 0,
            duration: 0.64,
            transformOrigin: "50% 50%",
          },
          "-=0.38",
        )
        .from(
          "[data-welcome-copy]",
          {
            y: 22,
            autoAlpha: 0,
            duration: 0.5,
            stagger: 0.1,
          },
          "-=0.28",
        )
        .to(
          "[data-welcome-cta]",
          {
            "--glow": 0.84,
            duration: 1.7,
            ease: "expo.inOut",
            yoyo: true,
            repeat: -1,
          },
          "-=0.1",
        );
    },
    { scope: root },
  );

  return (
    <main
      ref={root}
      className="mx-auto flex min-h-[calc(100dvh-6.5rem)] w-full max-w-[28rem] flex-col justify-center overflow-visible px-5 py-10 lg:min-h-[calc(100dvh-4.75rem)] lg:py-16"
    >
      <div className="relative mx-auto w-full max-w-[19rem] overflow-visible pt-7 pe-5">
        <WashiTape tone="mustard" corner="tl" className="welcome-tape z-30" />
        <WashiTape tone="rose" corner="bl" className="welcome-tape z-30" />

        <article
          data-welcome-polaroid=""
          className="relative overflow-visible border border-[#2A1A14] bg-[#F4EFE6] p-[0.7rem] pb-0 shadow-[4px_4px_0_0_#2A1A14] -rotate-1"
        >
          <div className="relative grid aspect-[4/5] place-items-center overflow-hidden bg-[#E4D5C1]">
            <video
              className="absolute inset-0 h-full w-full object-cover object-[center_58%]"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/welcome/cardboard-phone-swipe.jpg"
              aria-hidden="true"
              onLoadedData={(event) => {
                if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                  event.currentTarget.pause();
                }
              }}
            >
              <source src="/welcome/cardboard-phone-swipe.mp4" type="video/mp4" />
            </video>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#E4D5C1] to-transparent"
            />
            <p
              dir="ltr"
              className="absolute bottom-4 z-10 font-[family-name:var(--font-typewriter)] text-[16px] tracking-[0.02em] text-[#2A1A14]"
            >
              {copy.handle}
            </p>
          </div>
          <p className="px-1 py-3.5 font-[family-name:var(--font-handwritten)] text-[16px] leading-5 text-[#2A1A14]">
            {t.nav.waitlist}
          </p>
        </article>

        <p
          data-welcome-stamp=""
          className="pointer-events-none absolute top-4 end-0 z-20 rotate-[-8deg] overflow-visible border-[3px] border-[#8B3A32] px-3 py-2.5 text-center font-[family-name:var(--font-alfa)] text-[16px] leading-5 tracking-[-0.02em] text-[#8B3A32] whitespace-nowrap rtl:font-[family-name:var(--font-amiri)]"
        >
          {copy.stamp}
        </p>
      </div>

      <h1
        data-welcome-copy=""
        className="mt-10 max-w-[16ch] text-[28px] leading-[1.08] text-[#2A1A14] lg:text-[32px]"
      >
        {copy.title}
      </h1>
      <p
        data-welcome-copy=""
        className="mt-3 max-w-[40ch] text-[16px] leading-6 text-[#6B4A3A]"
      >
        {copy.lede}
      </p>
      <a
        data-welcome-copy=""
        data-welcome-cta=""
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackInstagramFollow()}
        className="welcome-follow mt-6 flex h-14 w-full items-center justify-center border border-[#2A1A14] bg-[#2A1A14] text-[16px] font-semibold tracking-[-0.01em] text-[#F4EFE6]"
      >
        {copy.cta}
      </a>
    </main>
  );
}
