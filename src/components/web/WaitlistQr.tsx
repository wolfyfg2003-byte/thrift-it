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
        color: { dark: "#3a2a1c", light: "#FDFBF7" },
      }).then((data: string) => {
        if (!cancelled) setSrc(data);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [href, size]);

  return (
    <figure
      className="rounded-[1.15rem] border bg-[#FDFBF7] p-3"
      style={{ borderColor: "#E5D9C4" }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="mx-auto"
          style={{ width: size * 0.69, height: size * 0.69 }}
        />
      ) : (
        <div
          className="mx-auto rounded-lg bg-[oklch(0.96_0.012_82)]"
          style={{ width: size * 0.69, height: size * 0.69 }}
        />
      )}
      <figcaption className="mt-2 text-center text-[12px] leading-4 text-[oklch(0.5_0.02_55)]">
        Scan to open this waitlist on your phone. Not an app-store listing.
      </figcaption>
      <p className="sr-only">{label}</p>
    </figure>
  );
}
