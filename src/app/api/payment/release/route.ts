import { NextResponse } from "next/server";
import { completeTransaction } from "@/lib/transactions";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    listingId?: string;
    source?: "buyer_accept" | "auto_release";
  };
  if (!body.listingId) {
    return NextResponse.json({ error: "listingId is required." }, { status: 400 });
  }

  try {
    const transaction = await completeTransaction(
      body.listingId,
      body.source === "auto_release" ? "auto_release" : "buyer_accept",
    );
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }
    return NextResponse.json({ transaction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not release funds.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
