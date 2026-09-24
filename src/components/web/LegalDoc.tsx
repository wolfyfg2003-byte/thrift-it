import Link from "next/link";
import type { ReactNode } from "react";

export function LegalDoc({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--canvas)] px-6 py-16 text-[var(--ink)]">
      <div className="mx-auto max-w-[42rem]">
        <p className="font-typewriter text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
          {kicker}
        </p>
        <h1 className="mt-3 font-display text-[32px] leading-10">{title}</h1>
        <div className="mt-8 space-y-5 font-[var(--font-ui)] text-base leading-7 text-[var(--muted)] [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-[20px] [&_h2]:leading-7 [&_h2]:text-[var(--ink)] [&_p]:max-w-[38rem] [&_a]:text-[var(--accent-secondary)] [&_a]:underline">
          {children}
        </div>
        <p className="mt-12 font-typewriter text-xs text-[var(--muted)]">
          <Link href="/">Back to Thrift It</Link>
          {" · "}
          <Link href="/privacy">Privacy</Link>
          {" · "}
          <Link href="/terms">Terms</Link>
          {" · "}
          <Link href="/support">Support</Link>
        </p>
      </div>
    </main>
  );
}
