"use client";

import { useEffect, useState } from "react";

type WaitlistQrProps = {
  href?: string;
  size?: number;
};

export function WaitlistQr({ href, size = 220 }: WaitlistQrProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [label, setLabel] = useState("Open this page on your phone");

  useEffect(() => {
    const target = href ?? `${window.location.origin}/#waitlist`;
    setLabel(target.replace(/^https?:\/\//, ""));
    let cancelled = false;
    void import("qrcode").then((mod) => {
      const QR = mod.default;
      return QR.toDataURL(target, {
        margin: 1,
        width: size,
        color: { dark: "#3a2a1c", light: "#F9F6F0" },
      }).then((data: string) => {
        if (!cancelled) setSrc(data);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [href, size]);

  return (
    <figure className="border border-[#2A1A14] bg-[#F4EFE6] p-3 shadow-[4px_4px_0_0_#2A1A14]">
      {src ? (
        <img
          src={src}
          alt=""
          className="mx-auto"
          style={{ width: size * 0.69, height: size * 0.69 }}
        />
      ) : (
        <div
          className="mx-auto bg-[#E4D5C1]"
          style={{ width: size * 0.69, height: size * 0.69 }}
        />
      )}
      <figcaption className="mt-2 text-center font-[family-name:var(--font-handwritten)] text-[12px] leading-4 text-[#6B4A3A]">
        Scan to open this waitlist on your phone. Not an app-store listing.
      </figcaption>
      <p className="sr-only">{label}</p>
    </figure>
  );
}
