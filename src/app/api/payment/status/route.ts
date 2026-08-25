import { NextResponse } from "next/server";
import { getTransaction } from "@/lib/transactions";

export async function GET(request: Request) {
  const listingId = new URL(request.url).searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "listingId is required." }, { status: 400 });
  }
  const transaction = getTransaction(listingId);
  return NextResponse.json({ transaction });
}
