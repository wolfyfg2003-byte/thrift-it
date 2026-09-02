"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

function isArabicPath(pathname: string) {
  return pathname === "/ar" || pathname.startsWith("/ar/");
}

/** Keeps <html lang/dir> in sync when the shared root layout does not remount. */
export function HtmlDirSync() {
  const pathname = usePathname() ?? "/";
  const arabic = isArabicPath(pathname);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = arabic ? "ar-AE" : "en-AE";
    root.dir = arabic ? "rtl" : "ltr";
  }, [arabic]);

  return null;
}
