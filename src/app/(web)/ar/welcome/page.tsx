import { WelcomeScene } from "@/components/web/WelcomeScene";
import { getDictionary } from "@/lib/i18n";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تمّت",
  robots: { index: false, follow: false },
};

export default function ArabicWelcomePage() {
  return <WelcomeScene t={getDictionary("ar")} />;
}
