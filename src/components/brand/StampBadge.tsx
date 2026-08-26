type StampBadgeProps = {
  label: string;
  className?: string;
};

export function StampBadge({ label, className = "" }: StampBadgeProps) {
  return (
    <span
      className={`stamp-ink inline-grid size-[5.25rem] shrink-0 place-items-center rounded-full px-2 text-center font-[family-name:var(--font-typewriter)] text-[10px] leading-[1.15] tracking-[0.06em] text-[#2A1A14] uppercase ${className}`}
    >
      {label}
    </span>
  );
}
