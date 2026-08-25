const GOLD = "#E5D9C4";
const EASE = "cubic-bezier(0.25, 1, 0.5, 1)";

type AccordionItem = {
  title: string;
  body: string;
};

type AccordionProps = {
  items: readonly AccordionItem[];
  name: string;
  heading?: "h2" | "h3";
};

export function Accordion({
  items,
  name,
  heading: Heading = "h3",
}: AccordionProps) {
  return (
    <div className="mt-8 border-t" style={{ borderColor: GOLD }}>
      {items.map((item) => (
        <details
          key={item.title}
          name={name}
          className="border-b"
          style={{ borderColor: GOLD }}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
            <Heading className="font-figtree text-[16px] leading-6 font-semibold tracking-[-0.02em] text-[oklch(0.22_0.025_55)] lg:text-[20px] lg:leading-7">
              {item.title}
            </Heading>
            <span className="relative size-4 shrink-0" aria-hidden>
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[oklch(0.22_0.025_55)]" />
              <span
                data-stem
                className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[oklch(0.22_0.025_55)] transition-transform duration-300"
                style={{ transitionTimingFunction: EASE }}
              />
            </span>
          </summary>
          <p className="max-w-[65ch] pb-5 text-[16px] leading-6 text-[oklch(0.42_0.03_55)]">
            {item.body}
          </p>
        </details>
      ))}
    </div>
  );
}
