type WashiTone = "mustard" | "rose" | "denim";
type WashiCorner = "tl" | "tr" | "bl" | "br";

const TONES: Record<WashiTone, string> = {
  mustard: "bg-[rgba(241,196,15,0.8)]",
  rose: "bg-[#D8829D]/80",
  denim: "bg-[#4B6584]/75",
};

const CORNERS: Record<WashiCorner, string> = {
  tl: "top-[-0.45rem] left-4 -rotate-[8deg] skew-x-[-12deg]",
  tr: "top-[-0.4rem] right-5 rotate-[11deg] skew-x-[10deg]",
  bl: "bottom-[-0.4rem] left-6 rotate-[7deg] skew-x-[-8deg]",
  br: "bottom-[-0.35rem] right-4 -rotate-[9deg] skew-x-[12deg]",
};

type WashiTapeProps = {
  tone?: WashiTone;
  corner?: WashiCorner;
  className?: string;
};

export function WashiTape({
  tone = "mustard",
  corner = "tl",
  className = "",
}: WashiTapeProps) {
  return (
    <span
      aria-hidden
      className={`washi-grain pointer-events-none absolute z-20 h-[1.05rem] w-[4.6rem] ${TONES[tone]} ${CORNERS[corner]} ${className}`}
    />
  );
}

type TapedPanelProps = {
  children: React.ReactNode;
  className?: string;
  tones?: readonly [WashiTone, WashiTone];
};

export function TapedPanel({
  children,
  className = "",
  tones = ["mustard", "rose"],
}: TapedPanelProps) {
  return (
    <div
      className={`relative border border-[#2A1A14] bg-[#F4EFE6] shadow-[4px_4px_0_0_#2A1A14] ${className}`}
    >
      <WashiTape tone={tones[0]} corner="tl" />
      <WashiTape tone={tones[1]} corner="tr" />
      {children}
    </div>
  );
}
