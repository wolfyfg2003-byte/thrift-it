import { NextResponse } from "next/server";
import { openDispute } from "@/lib/transactions";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    listingId?: string;
    reason?: string;
    details?: string;
  };
  if (!body.listingId || !body.reason?.trim()) {
    return NextResponse.json({ error: "listingId and reason are required." }, { status: 400 });
  }

  const transaction = openDispute(
    body.listingId,
    body.reason,
    body.details ?? "",
  );
  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }
  return NextResponse.json({ transaction });
}
