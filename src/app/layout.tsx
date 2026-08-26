import type { Metadata, Viewport } from "next";
import {
  Alfa_Slab_One,
  Architects_Daughter,
  Space_Grotesk,
  Special_Elite,
} from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-grotesk",
  weight: ["400", "500", "600", "700"],
});

const alfa = Alfa_Slab_One({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-alfa",
  weight: "400",
});

const elite = Special_Elite({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-elite",
  weight: "400",
});

const architect = Architects_Daughter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-architect",
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Thrift It",
    template: "%s · Thrift It",
  },
  description:
    "Photograph and list contemporary fashion for escrow-backed sale in Dubai.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F9F6F0",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${grotesk.variable} ${alfa.variable} ${elite.variable} ${architect.variable}`}
    >
      <body
        className={`${grotesk.className} min-h-dvh bg-[#F9F6F0] text-[#2A1A14] antialiased`}
      >
        {/*
          THESIS: Thrift It is a cut-and-paste closet, not a SaaS feed — Polaroids, ransom type, and escrow stamps.
          OWN-WORLD: Parchment #F9F6F0, espresso #2A1A14, dusty rose, faded denim, mustard washi; Alfa Slab / Special Elite / Architects Daughter / Space Grotesk; hard 4px ink offsets.
          STORY: The website sells the waitlist as a scrapbook spread. The app is a loosely stacked Polaroid deck with a cardboard offer drawer.
          FIRST VIEWPORT: Website home is ransom mark + waitlist taped to parchment, phone Polaroids on the right. App home at /app is the live Polaroid deck.
          FORM: Analog Y2K scrapbook collage. Seed skipped — user-pinned tokens and treatments.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
        */}
        {children}
      </body>
    </html>
  );
}
