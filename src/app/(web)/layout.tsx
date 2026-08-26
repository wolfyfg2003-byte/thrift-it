import { Footer } from "@/components/web/Footer";
import { Header } from "@/components/web/Header";

export default function WebLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <div id="main-content" className="pt-[6.5rem] lg:pt-[4.75rem]">
        {children}
      </div>
      <Footer />
    </>
  );
}
