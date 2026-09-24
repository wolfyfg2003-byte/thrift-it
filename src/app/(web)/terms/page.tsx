import { LegalDoc } from "@/components/web/LegalDoc";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms · Thrift It",
  description: "How Thrift It holds garments, inspects, and treats accounts.",
};

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of use" kicker="Thrift It · Dubai">
      <p>
        Thrift It is a person-to-person marketplace for physical secondhand
        clothing in the UAE. These terms cover the iOS app and thrifit.ae.
        Last updated 24 September 2026.
      </p>
      <h2>The hold</h2>
      <p>
        When you purchase, we authorize your card for the agreed price plus
        buyer protection and a flat courier fee. Funds sit until the piece is
        delivered. You have 48 hours after it lands to inspect at home. If you
        do not open a dispute in that window, we capture the hold for the
        seller.
      </p>
      <h2>What this is not</h2>
      <p>
        Thrift It Plus unlimited rewinds and listing boosts are not sold in
        this version. Digital features are not billed through Stripe. A later
        App Store subscription may offer them.
      </p>
      <h2>Your rail</h2>
      <p>
        You must be 17 or older. Listings and chats are your content. Do not
        post stolen goods, hate, or sexual content. We can remove a listing or
        close a rail that breaks this. You can report a listing, seller, or
        thread in the app, or email support@thrifit.ae.
      </p>
      <h2>Accounts</h2>
      <p>
        Sign in with email, Apple, or Google. Delete my rail in Settings
        permanently closes the account. Demonstration closets in the first
        beta are labeled as such and are not live inventory.
      </p>
      <p>
        Contact: support@thrifit.ae · Thrift It, Dubai, United Arab Emirates.
      </p>
    </LegalDoc>
  );
}
