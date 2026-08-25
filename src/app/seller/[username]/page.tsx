import { listListingsBySeller } from "@/lib/listings";
import { getSeller } from "@/lib/sellers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SellerProfileScreen from "./SellerProfileScreen";

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const seller = await getSeller(username);
  if (!seller) return { title: "Seller" };
  return { title: `${seller.handle} · Closet` };
}

export default async function SellerPage({ params }: PageProps) {
  const { username } = await params;
  const seller = await getSeller(username);
  if (!seller) notFound();
  const listings = await listListingsBySeller(seller.username);
  return <SellerProfileScreen seller={seller} listings={listings} />;
}
