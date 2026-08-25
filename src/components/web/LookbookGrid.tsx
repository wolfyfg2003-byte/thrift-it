import type { Listing } from "@/lib/listings";

const GOLD = "#E5D9C4";

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
        className="rounded-[1.5rem] border p-4"
        style={{ borderColor: GOLD }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="aspect-[3/4] w-full rounded-[1.1rem] object-cover"
          />
        ) : (
          <PlateFallback brand={listing.brand} className="aspect-[3/4]" />
        )}
      </figure>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <figure
          className="mt-8 rounded-[1.5rem] border p-3.5"
          style={{ borderColor: GOLD }}
        >
          {src ? (
            <img
              src={src}
              alt=""
              className={`w-full rounded-[0.95rem] object-cover ${CROPS[0].aspect} ${CROPS[0].object}`}
            />
          ) : (
            <PlateFallback brand={listing.brand} className={CROPS[0].aspect} />
          )}
        </figure>
        <figure
          className="mb-8 rounded-[1.5rem] border p-3.5"
          style={{ borderColor: GOLD }}
        >
          {src ? (
            <img
              src={src}
              alt=""
              className={`w-full rounded-[0.95rem] object-cover ${CROPS[1].aspect} ${CROPS[1].object}`}
            />
          ) : (
            <PlateFallback brand={listing.brand} className={CROPS[1].aspect} />
          )}
        </figure>
      </div>

      <figure
        className="mt-1 ml-auto w-[min(100%,22rem)] rounded-[1.5rem] border p-4 lg:mr-6"
        style={{ borderColor: GOLD }}
      >
        {src ? (
          <img
            src={src}
            alt=""
            className={`w-full rounded-[1.1rem] object-cover ${CROPS[2].aspect} ${CROPS[2].object}`}
          />
        ) : (
          <PlateFallback brand={listing.brand} className={CROPS[2].aspect} />
        )}
      </figure>
      <p className="mt-5 max-w-[42ch] text-[14px] leading-5 text-[oklch(0.5_0.02_55)]">
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
      className={`grid w-full place-items-center rounded-[1.1rem] bg-[oklch(0.93_0.02_75)] font-[family-name:var(--font-bodoni)] text-[48px] text-[oklch(0.38_0.05_52)] ${className}`}
    >
      {brand.slice(0, 1)}
    </div>
  );
}
