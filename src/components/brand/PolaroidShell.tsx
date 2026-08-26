import type { CSSProperties, PointerEventHandler, ReactNode, Ref } from "react";

export type PolaroidTilt = 1 | -1 | 1.5 | -1.5;

const TILTS: Record<PolaroidTilt, string> = {
  1: "rotate-1",
  [-1]: "-rotate-1",
  1.5: "rotate-[1.5deg]",
  [-1.5]: "-rotate-[1.5deg]",
};

type PolaroidShellProps = {
  children: ReactNode;
  caption: ReactNode;
  tilt?: PolaroidTilt;
  className?: string;
  style?: CSSProperties;
  articleRef?: Ref<HTMLElement | null>;
  onPointerDown?: PointerEventHandler<HTMLElement>;
  onPointerMove?: PointerEventHandler<HTMLElement>;
  onPointerUp?: PointerEventHandler<HTMLElement>;
  onPointerCancel?: PointerEventHandler<HTMLElement>;
};

/** Fits a Polaroid stack inside PhoneFrame without changing the phone chrome. */
export function InPhonePolaroidWell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-0 w-full flex-1 items-start justify-center pt-2">
      <div className="relative h-[min(100%,22.5rem)] w-auto max-w-[min(17.5rem,100%)] aspect-[3/3.72]">
        {children}
      </div>
    </div>
  );
}

export function PolaroidShell({
  children,
  caption,
  tilt = 1,
  className = "",
  style,
  articleRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: PolaroidShellProps) {
  return (
    <article
      ref={articleRef}
      className={`flex h-full flex-col border border-[#2A1A14] bg-[#F4EFE6] p-[0.7rem] pb-0 shadow-[4px_4px_0px_0px_#2A1A14] ${TILTS[tilt]} ${className}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#E4D5C1]">
        {children}
      </div>
      <div className="shrink-0 px-1 pt-3 pb-3.5">{caption}</div>
    </article>
  );
}

export function PolaroidCaption({
  title,
  price,
  retail,
  likes,
}: {
  title: string;
  price: string;
  retail?: string;
  likes?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <p className="min-w-0 font-[family-name:var(--font-typewriter)] text-[15px] leading-5 text-[#2A1A14]">
        {title}
      </p>
      <div className="shrink-0 text-right">
        <p className="font-[family-name:var(--font-handwritten)] text-[18px] leading-none text-[#2A1A14]">
          {price}
        </p>
        {retail ? (
          <p className="mt-1 font-[family-name:var(--font-handwritten)] text-[13px] leading-none text-[#6B4A3A] line-through">
            {retail}
          </p>
        ) : null}
        {likes ? (
          <p className="mt-1 font-[family-name:var(--font-handwritten)] text-[13px] leading-none text-[#D8829D]">
            {likes}
          </p>
        ) : null}
      </div>
    </div>
  );
}
