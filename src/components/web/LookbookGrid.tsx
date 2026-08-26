import type { Listing } from "@/lib/listings";

const GOLD = "#2A1A14";

const CROPS = [
  { object: "object-[center_20%]", aspect: "aspect-[4/5]" },
  { object: "object-[center_80%]", aspect: "aspect-square" },
  { object: "object-left", aspect: "aspect-[3/4]" },
] as const;

type LookbookGridProps = {
  listing: Listing;
};

export function LookbookGrid({ listing }: LookbookGridProps) {
  const src = listing.original_photo_url;
  const alt = `${listing.brand} ${listing.title}`;

  return (
    <div>
      <figure
        className="border border-[#2A1A14] bg-[#F4EFE6] p-4 shadow-[4px_4px_0_0_#2A1A14] rotate-1"
        style={{ borderColor: GOLD }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
          className="aspect-[3/4] w-full border border-[#2A1A14] object-cover"
          />
        ) : (
          <PlateFallback brand={listing.brand} className="aspect-[3/4]" />
        )}
      </figure>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <figure
          className="mt-8 border border-[#2A1A14] bg-[#F4EFE6] p-3.5 shadow-[4px_4px_0_0_#2A1A14] -rotate-1"
          style={{ borderColor: GOLD }}
        >
          {src ? (
            <img
              src={src}
              alt=""
              className={`w-full border border-[#2A1A14] object-cover ${CROPS[0].aspect} ${CROPS[0].object}`}
            />
          ) : (
            <PlateFallback brand={listing.brand} className={CROPS[0].aspect} />
          )}
        </figure>
        <figure
          className="mb-8 border border-[#2A1A14] bg-[#F4EFE6] p-3.5 shadow-[4px_4px_0_0_#2A1A14] rotate-[1.5deg]"
          style={{ borderColor: GOLD }}
        >
          {src ? (
            <img
              src={src}
              alt=""
              className={`w-full border border-[#2A1A14] object-cover ${CROPS[1].aspect} ${CROPS[1].object}`}
            />
          ) : (
            <PlateFallback brand={listing.brand} className={CROPS[1].aspect} />
          )}
        </figure>
      </div>

      <figure
        className="mt-1 ml-auto w-[min(100%,22rem)] border border-[#2A1A14] bg-[#F4EFE6] p-4 shadow-[4px_4px_0_0_#2A1A14] -rotate-1 lg:mr-6"
        style={{ borderColor: GOLD }}
      >
        {src ? (
          <img
            src={src}
            alt=""
            className={`w-full border border-[#2A1A14] object-cover ${CROPS[2].aspect} ${CROPS[2].object}`}
          />
        ) : (
          <PlateFallback brand={listing.brand} className={CROPS[2].aspect} />
        )}
      </figure>
      <p className="mt-5 max-w-[42ch] font-[family-name:var(--font-handwritten)] text-[14px] leading-5 text-[#6B4A3A]">
        Original camera plate, cropped for the lookbook. Demonstration listing.
      </p>
    </div>
  );
}

function PlateFallback({
  brand,
  className,
}: {
  brand: string;
  className: string;
}) {
  return (
    <div
      className={`grid w-full place-items-center bg-[#E4D5C1] font-[family-name:var(--font-display)] text-[48px] text-[#2A1A14] ${className}`}
    >
      {brand.slice(0, 1)}
    </div>
  );
}
