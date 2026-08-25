"use client";

import {
  SIZE_PILLS,
  SIZE_TABS,
  parseSizeKey,
  sizeKey,
  toggleValue,
  type SizeSystem,
} from "@/lib/filters";
import { useState } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export function SizeMatrix({
  selected,
  onChange,
  mode = "multi",
  labelledBy,
  surface = "well",
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  mode?: "multi" | "single";
  labelledBy?: string;
  surface?: "well" | "page";
}) {
  const initial = selected.map(parseSizeKey).find(Boolean);
  const [sizeTab, setSizeTab] = useState<SizeSystem>(initial?.system ?? "standard");

  return (
    <div>
      <div className="overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          role="tablist"
          aria-label="Sizing matrix"
          aria-labelledby={labelledBy}
          className={`flex w-max min-w-full gap-0.5 rounded-full border border-[oklch(0.86_0.02_80)] p-1 ${
            surface === "page" ? "bg-[oklch(0.96_0.01_82)]" : "bg-[#FDFBF7]"
          }`}
        >
          {SIZE_TABS.map((tab) => {
            const active = sizeTab === tab.id;
            const count = selected.filter((key) => key.startsWith(`${tab.id}:`)).length;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSizeTab(tab.id)}
                className={`h-9 shrink-0 rounded-full px-3.5 text-[14px] leading-4 transition-colors duration-200 ${
                  active
                    ? "bg-[oklch(0.22_0.025_55)] font-semibold text-[oklch(0.98_0.012_85)]"
                    : "font-medium text-[oklch(0.42_0.03_55)] hover:bg-[oklch(0.96_0.01_82)]"
                }`}
                style={{ transitionTimingFunction: EASE }}
              >
                {tab.label}
                {mode === "multi" && count > 0 && !active ? (
                  <span className="ml-1.5 text-[12px] tabular-nums text-[oklch(0.38_0.04_52)]">
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {SIZE_PILLS[sizeTab].map((pill) => {
          const key = sizeKey(sizeTab, pill.value);
          const pressed = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={pressed}
              onClick={() => {
                if (mode === "single") {
                  onChange([key]);
                  return;
                }
                onChange(toggleValue(selected, key));
              }}
              className={`h-9 min-w-10 rounded-full border px-3.5 text-[14px] tabular-nums transition-colors duration-200 ${
                pressed
                  ? `border-[oklch(0.78_0.03_72)] font-semibold text-[oklch(0.22_0.025_55)] ${
                      surface === "page" ? "bg-[oklch(0.96_0.01_82)]" : "bg-[#FDFBF7]"
                    }`
                  : "border-[oklch(0.86_0.02_80)] bg-transparent font-medium text-[oklch(0.38_0.03_55)] hover:bg-[oklch(0.94_0.012_82)]"
              }`}
              style={{ transitionTimingFunction: EASE }}
            >
              {pill.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
