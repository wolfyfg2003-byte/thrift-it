import { Footer } from "@/components/web/Footer";
import { Header } from "@/components/web/Header";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";
import { captureMetaCapiVisitor, sendMetaCapiEvent } from "@/lib/meta-capi";
import { after } from "next/server";

export default async function WebLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const visitor = await captureMetaCapiVisitor();
  after(() =>
    sendMetaCapiEvent(
      {
        eventName: "PageView",
        eventId: crypto.randomUUID(),
      },
      visitor,
    ),
  );

  return (
    <>
      <Header locale={locale} t={dictionary} />
      <div id="main-content" className="pt-[4.25rem] lg:pt-[4.75rem]">
        {children}
      </div>
      <Footer />
    </>
  );
}
