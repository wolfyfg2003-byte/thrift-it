import { ImageResponse } from "next/og";

export const alt =
  "Thrift It — pre-loved luxury resale in Dubai. Join the waitlist.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#F9F6F0",
          color: "#2A1A14",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 72,
            width: 176,
            height: 18,
            background: "rgba(241, 196, 15, 0.8)",
            transform: "rotate(-2deg)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "72px 80px",
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#6B4A3A",
              marginBottom: 18,
            }}
          >
            Dubai · UAE
          </div>
          <div
            style={{
              fontSize: 72,
              lineHeight: 0.95,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              maxWidth: 820,
            }}
          >
            Thrift It
          </div>
          <div
            style={{
              marginTop: 22,
              fontSize: 32,
              lineHeight: 1.2,
              color: "#4B6584",
              maxWidth: 780,
            }}
          >
            Pre-loved luxury. 0% commission resale.
          </div>
          <div
            style={{
              marginTop: 40,
              display: "flex",
              gap: 16,
            }}
          >
            <div
              style={{
                border: "2px solid #2A1A14",
                background: "#D8829D",
                padding: "12px 20px",
                fontSize: 22,
                fontWeight: 700,
                boxShadow: "6px 6px 0 #2A1A14",
              }}
            >
              Join the waitlist
            </div>
            <div
              style={{
                border: "2px solid #2A1A14",
                background: "#F4EFE6",
                padding: "12px 20px",
                fontSize: 22,
              }}
            >
              48-hour inspect-at-home · AED 20 shipping
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
