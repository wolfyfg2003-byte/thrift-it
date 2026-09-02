import { ImageResponse } from "next/og";

export const alt = "ثرفت إت — أزياء فاخرة مستعملة في دبي. انضمّي لقائمة الانتظار.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadAmiri() {
  const response = await fetch(
    "https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf",
  );
  if (!response.ok) {
    throw new Error("Could not load Amiri for the Arabic Open Graph card.");
  }
  return response.arrayBuffer();
}

export default async function ArabicOpenGraphImage() {
  const amiri = await loadAmiri();

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
          direction: "rtl",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 72,
            width: 176,
            height: 18,
            background: "rgba(241, 196, 15, 0.8)",
            transform: "rotate(2deg)",
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
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: "#6B4A3A",
              marginBottom: 18,
            }}
          >
            دبي · الإمارات
          </div>
          <div
            style={{
              fontSize: 72,
              lineHeight: 1.1,
              fontWeight: 400,
              maxWidth: 900,
              textAlign: "right",
            }}
          >
            ثرفت إت
          </div>
          <div
            style={{
              marginTop: 22,
              fontSize: 32,
              lineHeight: 1.35,
              color: "#4B6584",
              maxWidth: 860,
              textAlign: "right",
            }}
          >
            أزياء فاخرة مستعملة. إعادة بيع بعمولة صفر.
          </div>
          <div
            style={{
              marginTop: 40,
              display: "flex",
              gap: 16,
              flexDirection: "row-reverse",
            }}
          >
            <div
              style={{
                border: "2px solid #2A1A14",
                background: "#D8829D",
                padding: "12px 20px",
                fontSize: 22,
                boxShadow: "6px 6px 0 #2A1A14",
              }}
            >
              انضمّي لقائمة الانتظار
            </div>
            <div
              style={{
                border: "2px solid #2A1A14",
                background: "#F4EFE6",
                padding: "12px 20px",
                fontSize: 22,
              }}
            >
              فحص منزلي 48 ساعة · شحن 20 درهماً
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Amiri",
          data: amiri,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
