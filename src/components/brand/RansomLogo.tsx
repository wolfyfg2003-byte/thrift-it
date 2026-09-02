import Link from "next/link";

const CLIPS = [
  { ch: "T", fill: "sand", rot: -6, lift: 3 },
  { ch: "h", fill: "rose", rot: 5, lift: -2 },
  { ch: "r", fill: "denim", rot: -3, lift: 2 },
  { ch: "i", fill: "sand", rot: 7, lift: -4 },
  { ch: "f", fill: "rose", rot: -5, lift: 1 },
  { ch: "t", fill: "denim", rot: 4, lift: 3 },
  { ch: "I", fill: "sand", rot: -8, lift: -1, gap: true },
  { ch: "t", fill: "rose", rot: 6, lift: 2 },
] as const;

const FILLS = {
  sand: "bg-[#E4D5C1] text-[#2A1A14]",
  rose: "bg-[#D8829D] text-[#2A1A14]",
  denim: "bg-[#4B6584] text-[#F9F6F0]",
} as const;

type RansomLogoProps = {
  href?: string | false;
  size?: "nav" | "hero";
};

export function RansomLogo({ href = "/", size = "nav" }: RansomLogoProps) {
  const mark = (
    <span
      dir="ltr"
      aria-label="Thrift It"
      className={`inline-flex items-center ${size === "hero" ? "gap-1.5" : "gap-[0.2rem]"}`}
    >
      {CLIPS.map((clip, index) => (
        <span
          key={`${clip.ch}-${index}`}
          aria-hidden
          className={`inline-block font-[family-name:var(--font-alfa)] leading-none shadow-[2px_2px_0_0_#2A1A14] ${
            FILLS[clip.fill]
          } ${
            size === "hero"
              ? "px-2.5 py-1.5 text-[28px]"
              : "px-1.5 py-[0.2rem] text-[15px] lg:px-[0.4rem] lg:text-[17px]"
          } ${"gap" in clip && clip.gap ? "ml-2 lg:ml-2.5" : ""}`}
          style={{
            transform: `rotate(${clip.rot}deg) translateY(${clip.lift}px)`,
          }}
        >
          {clip.ch}
        </span>
      ))}
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} dir="ltr" className="shrink-0 no-underline">
      {mark}
    </Link>
  );
}
