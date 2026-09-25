import { BUYER_PROTECTION_RATE, BUYER_SHIPPING_AED } from "@/lib/shipping-fee";
import Stripe from "stripe";

export const PLUS_MONTHLY_AED = 19;
export const HOLD_DAYS = 7;
export const INSPECT_HOURS = 48;

export function quoteCheckout(price: number) {
  const item = Math.round(price);
  const protection = Math.round(item * BUYER_PROTECTION_RATE);
  const shipping = BUYER_SHIPPING_AED;
  return {
    item,
    protection,
    shipping,
    total: item + protection + shipping,
  };
}

export function aedToFils(amount: number): number {
  return Math.round(amount * 100);
}

export function holdExpiresAt(from = new Date()): string {
  const end = new Date(from);
  end.setUTCDate(end.getUTCDate() + HOLD_DAYS);
  return end.toISOString();
}

export function deliveryCapturePlan(
  deliveredAt: Date,
  holdExpiresAtIso: string | null,
): { captureMode: "inspect_end" | "on_delivered"; autoReleaseAt: string } {
  const inspectEnd = new Date(deliveredAt.getTime() + INSPECT_HOURS * 60 * 60 * 1000);
  const holdEnd = holdExpiresAtIso ? new Date(holdExpiresAtIso) : inspectEnd;
  if (inspectEnd.getTime() <= holdEnd.getTime()) {
    return { captureMode: "inspect_end", autoReleaseAt: inspectEnd.toISOString() };
  }
  return { captureMode: "on_delivered", autoReleaseAt: inspectEnd.toISOString() };
}

export function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Could not start the hold.");
  return new Stripe(key);
}

export async function captureIfNeeded(
  stripe: Stripe,
  paymentIntentId: string | null,
): Promise<boolean> {
  if (!paymentIntentId) return false;
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status === "succeeded") return true;
  if (intent.status === "requires_capture") {
    await stripe.paymentIntents.capture(paymentIntentId);
    return true;
  }
  return false;
}

export async function reverseHold(
  stripe: Stripe,
  paymentIntentId: string | null,
): Promise<void> {
  if (!paymentIntentId) return;
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status === "requires_capture") {
    await stripe.paymentIntents.cancel(paymentIntentId);
    return;
  }
  if (intent.status === "succeeded") {
    await stripe.refunds.create({ payment_intent: paymentIntentId });
  }
}
