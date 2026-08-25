import { NextResponse } from "next/server";
import { updateAjexStatus, type AjexStatus } from "@/lib/transactions";

const STEPS: AjexStatus[] = [
  "label_printed",
  "picked_up",
  "out_for_delivery",
  "delivered",
];

export async function POST(request: Request) {
  const body = (await request.json()) as {
    listingId?: string;
    ajex_status?: AjexStatus;
  };
  if (!body.listingId || !body.ajex_status || !STEPS.includes(body.ajex_status)) {
    return NextResponse.json({ error: "listingId and ajex_status are required." }, { status: 400 });
  }

  const transaction = updateAjexStatus(body.listingId, body.ajex_status);
  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }
  return NextResponse.json({ transaction });
}
