import { NextResponse } from "next/server";
import { createEscrowHold } from "@/lib/transactions";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    listingId?: string;
    itemPrice?: number;
    chatId?: string;
  };
  const listingId = body.listingId;
  const itemPrice = body.itemPrice;
  if (!listingId || !Number.isFinite(itemPrice) || itemPrice === undefined || itemPrice <= 0) {
    return NextResponse.json({ error: "listingId and itemPrice are required." }, { status: 400 });
  }

  try {
    const transaction = await createEscrowHold({
      listingId,
      itemPrice: Math.round(itemPrice),
      chatId: body.chatId || null,
    });
    return NextResponse.json({ transaction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not open escrow.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
