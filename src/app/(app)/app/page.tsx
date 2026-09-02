import { listCuratedDeck } from "@/app/actions/taste";
import { isProduction } from "@/lib/env";
import AppDock from "@/components/AppDock";
import HomeDeck from "@/components/HomeDeck";
import HomeHeader from "@/components/HomeHeader";
import PlusPaywall from "@/components/PlusPaywall";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "App",
};

export default async function AppHomePage() {
  const listings = await listCuratedDeck();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[28rem] flex-col bg-[#F9F6F0] px-5 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <HomeHeader />
      <HomeDeck listings={listings} preserveServerOrder={isProduction()} />
      <PlusPaywall />
      <AppDock />
    </main>
  );
}
