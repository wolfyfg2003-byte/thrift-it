import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
  weight: ["400", "500", "600", "700"],
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bodoni",
  weight: ["400", "500", "600", "700"],
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
  themeColor: "#FDFBF7",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${figtree.variable} ${bodoni.variable}`}>
      <body
        className={`${figtree.className} min-h-dvh bg-[#FDFBF7] text-[oklch(0.22_0.025_55)] antialiased`}
      >
        {/*
          THESIS: Thrift It is a wardrobe detox, not a classified dump — original camera plates and escrow first.
          OWN-WORLD: Canvas #FDFBF7, Bodoni Moda display, Figtree UI, espresso ink, date-palm bronze on CTAs only.
          STORY: The website sells the waitlist and the lookbook. The app is the swipe-and-escrow closet.
          FIRST VIEWPORT: Website home is Coming Soon + editorial. App home at /app is the live deck.
          FORM: Route groups (web) and (app). Header/footer never wrap the PWA.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
        */}
        {children}
      </body>
    </html>
  );
}
