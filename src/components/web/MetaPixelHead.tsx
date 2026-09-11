import { META_PIXEL_ID, metaPixelHeadScript } from "@/lib/meta-pixel";

/** Base pixel in <head>, matching Meta's install instructions. */
export function MetaPixelHead() {
  if (!META_PIXEL_ID) return null;

  return (
    <>
      {/* Meta Pixel Code */}
      <script
        dangerouslySetInnerHTML={{ __html: metaPixelHeadScript(META_PIXEL_ID) }}
      />
      <noscript>
        <img
          height={1}
          width={1}
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      {/* End Meta Pixel Code */}
    </>
  );
}
