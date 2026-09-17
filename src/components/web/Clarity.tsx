"use client";

import { CLARITY_PROJECT_ID, isWebsiteClarityPath } from "@/lib/clarity";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Tag SPA route changes. First page is captured by the head snippet. */
export function Clarity() {
  const pathname = usePathname();
  const skipFirst = useRef(true);

  useEffect(() => {
    if (!CLARITY_PROJECT_ID || !isWebsiteClarityPath(pathname)) return;
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (typeof window.clarity !== "function") return;
    window.clarity("set", "page", pathname);
  }, [pathname]);

  return null;
}
