"use client";

import { trackInstagramFollow } from "@/lib/analytics";
import { INSTAGRAM_WEB_URL, openInstagramProfile } from "@/lib/instagram";
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

type InstagramFollowLinkProps = {
  children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel" | "onClick">;

export function InstagramFollowLink({
  children,
  className,
  ...rest
}: InstagramFollowLinkProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    trackInstagramFollow();
    openInstagramProfile(event.nativeEvent);
  };

  return (
    <a
      {...rest}
      href={INSTAGRAM_WEB_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={className}
    >
      {children}
    </a>
  );
}

export function InstagramGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.25"
        y="3.25"
        width="17.5"
        height="17.5"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="4.15" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.15" cy="6.85" r="1.05" fill="currentColor" />
    </svg>
  );
}
