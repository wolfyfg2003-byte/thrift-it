const LINE = "#2A1A14";
const EASE = "cubic-bezier(0.19, 1, 0.22, 1)";

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
    <div className="mt-8 border-t" style={{ borderColor: LINE }}>
      {items.map((item) => (
        <details
          key={item.title}
          name={name}
          className="border-b"
          style={{ borderColor: LINE }}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
            <Heading className="font-[family-name:var(--font-typewriter)] text-[16px] leading-6 text-[#2A1A14] lg:text-[20px] lg:leading-7">
              {item.title}
            </Heading>
            <span className="relative size-4 shrink-0" aria-hidden>
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#2A1A14]" />
              <span
                data-stem
                className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#2A1A14] transition-transform duration-300"
                style={{ transitionTimingFunction: EASE }}
              />
            </span>
          </summary>
          <p className="max-w-[65ch] pb-5 text-[16px] leading-6 text-[#6B4A3A]">
            {item.body}
          </p>
        </details>
      ))}
    </div>
  );
}
