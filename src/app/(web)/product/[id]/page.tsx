import { LookbookGrid } from "@/components/web/LookbookGrid";
import { TransactionSidebar } from "@/components/web/TransactionSidebar";
import { getListing, listListings } from "@/lib/listings";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const listings = await listListings();
  return listings.map((item) => ({ id: item.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Lookbook" };
  return {
    title: `${listing.brand} ${listing.title}`,
    description: listing.description ?? `${listing.brand} on Thrift It.`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  return (
    <main className="min-h-dvh bg-[#FDFBF7]">
      <div className="mx-auto w-full max-w-[72rem] px-5 py-8 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14 lg:items-start">
          <div className="lg:col-span-7">
            <LookbookGrid listing={listing} />
          </div>
          <TransactionSidebar listing={listing} />
        </div>
      </div>
    </main>
  );
}
