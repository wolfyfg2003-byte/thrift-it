import { getListing } from "@/lib/listings";
import { formatAed } from "@/lib/checkout";
import { isOfferAtOrAboveFloor } from "@/lib/offers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CheckoutScreen from "./CheckoutScreen";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ offer?: string; chat?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Checkout" };
  const offer = Number((await searchParams).offer);
  const price =
    Number.isFinite(offer) && isOfferAtOrAboveFloor(offer, listing.price)
      ? Math.round(offer)
      : listing.price;
  return {
    title: `Pay ${formatAed(price)} · ${listing.brand}`,
    description: `Thrift It escrow checkout for ${listing.brand} ${listing.title}.`,
  };
}

export default async function CheckoutPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const paramsBag = await searchParams;
  const offer = Number(paramsBag.offer);
  const chatId = paramsBag.chat?.trim() || null;
  const charged =
    Number.isFinite(offer) && isOfferAtOrAboveFloor(offer, listing.price)
      ? Math.round(offer)
      : listing.price;

  return <CheckoutScreen listing={{ ...listing, price: charged }} chatId={chatId} />;
}
