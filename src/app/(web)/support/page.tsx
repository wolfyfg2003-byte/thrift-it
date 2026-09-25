import { LegalDoc } from "@/components/web/LegalDoc";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support · Thrift It",
  description: "How to reach Thrift It about a hold, listing, or account.",
};

export default function SupportPage() {
  return (
    <LegalDoc title="Support" kicker="Thrift It · Dubai">
      <p>
        Email support@thrifit.ae. We read reports from the app and this inbox.
      </p>
      <h2>Holds and inspect</h2>
      <p>
        Open a dispute from the invoice in the app within 48 hours of
        delivery. If the app cannot send it, write to us with the slip number.
      </p>
      <h2>Courier</h2>
      <p>
        Buyers pay a flat AED 25 for a city UAE job. Allow 2–4 days after the
        seller marks the piece packed. This is not next-day. If a parcel is
        stuck, email support@thrifit.ae with the tracking link from the
        invoice.
      </p>
      <h2>Accounts</h2>
      <p>
        Delete my profile lives in Settings. If that fails, email from the
        address on the account and we will close it.
      </p>
      <h2>Report a closet</h2>
      <p>
        Use Report on a listing, seller, or thread. Include photos if the
        garment does not match.
      </p>
    </LegalDoc>
  );
}
