import { LegalDoc } from "@/components/web/LegalDoc";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Thrift It",
  description: "What Thrift It collects, why, and how you delete it.",
};

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" kicker="Thrift It · Dubai">
      <p>
        Thrift It is a Dubai closet marketplace. This page is the privacy policy
        for the iOS app and thrifit.ae. Last updated 24 September 2026.
      </p>
      <h2>What we collect</h2>
      <p>
        Account: email, name (from you, Apple, or Google), and a UAE mobile
        number when you buy or sell. Apple Hide My Email addresses are accepted.
      </p>
      <p>
        Listings: photos you take or import, garment details, and a delivery
        address in the UAE. Chats and offers you send to another closet.
      </p>
      <p>
        Payments: Stripe processes card and Apple Pay authorizations. We store
        a payment intent id and hold status. We do not store full card numbers
        or CVV.
      </p>
      <h2>Why</h2>
      <p>
        To create your rail, hold a garment in escrow, arrange a courier, and
        keep the 48-hour inspect-at-home window. We do not sell this data. We
        do not run App Tracking Transparency ads.
      </p>
      <h2>Who else sees it</h2>
      <p>
        Supabase hosts identity and escrow records. Stripe processes holds.
        The other party on a sale sees what they need to ship or inspect. A
        report you file is read by support@thrifit.ae.
      </p>
      <h2>Delete my rail</h2>
      <p>
        In the app: Settings → Delete my rail. That wipes the account and
        associated profile. You can also email support@thrifit.ae.
      </p>
      <p>
        Contact: support@thrifit.ae · Thrift It, Dubai, United Arab Emirates.
      </p>
    </LegalDoc>
  );
}
