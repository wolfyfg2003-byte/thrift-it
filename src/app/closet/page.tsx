import ClosetScreen from "@/app/closet/ClosetScreen";
import { listListings } from "@/lib/listings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Closet",
};

export default async function ClosetPage() {
  const listings = await listListings();
  return <ClosetScreen listings={listings} />;
}
