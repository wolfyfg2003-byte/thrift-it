"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * SPA PageViews after the first load. Init + first PageView live in <head>.
 * Lead is fired from trackWaitlist after a new signup.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const skipFirstView = useRef(true);

  useEffect(() => {
    if (skipFirstView.current) {
      skipFirstView.current = false;
      return;
    }
    if (typeof window.fbq !== "function") return;
    window.fbq("track", "PageView");
  }, [pathname]);

  return null;
}
