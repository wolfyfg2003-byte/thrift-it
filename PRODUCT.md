# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (React) Progressive Web App, Tailwind CSS, and Supabase. Chosen so the product can launch from a URL, be added to a phone home screen, and avoid App Store / Play Store approval for UAE escrow payments. Native iOS and Android are out of scope for the MVP.

## Users

Two-sided circular fashion marketplace. Both sides are in scope for the MVP.

**Primary seller — the Wardrobe Detoxer.** Fashionable, middle-to-high-income expatriate women and regional micro-influencers, roughly 25–45, living in dense Dubai districts (Marina, Downtown, Jumeirah). Expats are the large majority of the UAE population and move often, so they regularly purge high-quality wardrobes. Job: convert pristine premium contemporary garments into cash without classified haggling or arranging deliveries themselves.

**Primary buyer — the Smart Fashionista.** Trend-conscious Gen Z and Millennial shoppers who want premium cult contemporary labels (e.g. House of CB, Self-Portrait, Rat & Boa) and high-end modest fashion, bought sustainably. Job: discover verified premium contemporary pieces at a steep discount versus retail, with a transaction that is secure, tracked, and treated as authentic.

## Product Purpose

A fully transactional peer-to-peer and consignment marketplace for contemporary fashion in Dubai. The MVP exists to validate real local demand in founders’ spare time — without spending AED 50,000+ on an agency or giving up equity to a technical co-founder.

Success is a working loop: a seller can list or hand off a wardrobe, a buyer can pay with confidence, and an item can move through escrow and domestic courier pickup/delivery. “Up to 80% off retail” is the buyer’s intended outcome, not a verified benchmark.

## Positioning

UAE resale today is split: classifieds (Dubizzle, Facebook Marketplace) have no escrow, structured negotiation, or integrated courier; pure P2P apps (WearTwice) are self-service with no managed concierge; rental/resale hubs (Best Kept Shared, Endless) charge around 30% on standard P2P; luxury consignment (The Luxury Closet, Garderobe) is warehouse-led, takes steep tiered commissions, and often rejects contemporary/high-street below luxury thresholds.

This product’s claim a neighbor cannot truthfully copy: **0% seller commission on self-listed contemporary fashion** (to seed supply) **plus a 50/50 managed wardrobe concierge** for high-net-worth expats who want a hands-off detox. Founders own the codebase (no no-code host lock-in) so regional rails such as Mamo Pay escrow and AJEX courier can be integrated directly.

## Operating Context

Founders are non-technical relative to hiring a co-founder, building in spare time with Cursor. Users are mobile-first in a ~99% internet-penetration market; the PWA must feel app-like on a phone (home-screen icon, no browser chrome) without App Store distribution.

Real usage involves photographing and listing garments, escrow payment, and domestic courier pickup — not in-person classified meetups. Target supply is premium contemporary and high-end modest fashion, not warehouse luxury-only inventory.

## Capabilities and Constraints

Confirmed for the MVP:

- Hybrid listings: self-serve P2P (0% seller commission) and managed concierge (50/50 split).
- Fully transactional: payment escrow and integrated courier, not chat-and-meetup.
- Regional rails to integrate: **Mamo Pay** for escrow; **AJEX** for domestic shipping (weight-based, base around AED 20).
- Web PWA only for launch; native store apps deferred because UAE escrow apps face account, audit, and review friction.
- Product name is **undecided**.

Explicitly undecided: authentication operations (manual vs partner vs later tooling), exact catalog taxonomy, and whether Telr or other payment partners appear alongside Mamo Pay.

## Brand Commitments

Product name: **Thrift It**. Binding taste: high-status GCC fashion, warm canvas `#FDFBF7`, elegant serif display with a clean sans for UI. Do not substitute a generic global resale look.

House of CB, Self-Portrait, Rat & Boa, and modest abaya labels may appear as seller autocomplete suggestions (labels buyers search). Do not claim partnerships, exclusives, or endorsement.

## Evidence on Hand

Preserve these as research facts, not as this product’s own proof:

- Competitor identities: Best Kept Shared (Kelly Power, Sophie Kjøller; acquired BAZAARA / Alyssa Mariano); Endless (Rosie Gunn); Melltoo (Morrad Irsane, Sharene Lee; acquired by Cartlow); Garderobe (Micha Maatouk); The Luxury Closet (Kunal Kapoor); Cartlow (Mohammed Sleiman). WearTwice as a zero-commission-style P2P player with a buyer protection fee.
- Commission benchmarks: WearTwice ~20% buyer protection fee; Garderobe ~15–45% by item value; Best Kept Shared ~30% standard P2P and ~50% managed wardrobe.
- Local integrations in the category: Mamo Pay (noted with WearTwice), Telr (noted with Best Kept Shared), AJEX domestic shipping, Real Authentication (noted with Endless for luxury handbags).
- Market stats cited by founders: UAE internet penetration ~99%; ~61% of UAE residents prefer buying sustainable fashion; women influence ~80% of Dubai household retail purchases; Emirati women spend ~43% of personal income on fashion/apparel (treat as cited research, not as this product’s results).

Must not fabricate:

- This product’s name, customers, inventory, testimonials, press, or traction.
- Fake UAE fashion apps, or localized GCC portals/AED lockers for global players such as Vinted unless that presence is later confirmed.
- Misattributed founder names or roles.
- Automated AI receipt verification or instant computer-vision authentication as if it were live (The Luxury Closet has discussed evaluating computer vision; that is not this product’s capability).

## Product Principles

1. **Trust is the transaction.** Escrow, tracking, and authenticity-as-peace-of-mind beat classified speed; never design a meetup-and-hope path as the happy path.
2. **Supply has two doors.** Self-list at 0% seller commission to grow contemporary inventory; concierge at 50/50 for sellers who will not photograph 40 dresses themselves.
3. **Contemporary, not warehouse luxury.** Win the premium contemporary and modest-fashion gap luxury consignment rejects — do not impersonate The Luxury Closet.
4. **Own the rails.** Direct Mamo Pay and AJEX integrations in a codebase the founders own; no closed no-code host as the system of record.
5. **Prove demand before theater.** Spare-time MVP in Dubai; do not spend the page on invented social proof or App Store distribution.
