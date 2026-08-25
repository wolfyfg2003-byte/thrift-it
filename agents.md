# Project Instructions: Apex Swap (P2P Resale & Consignment)

## Tech Stack & Rails
- **Frontend:** Next.js (App Router), Tailwind CSS, React
- **Backend/DB:** Supabase (PostgreSQL with Realtime capabilities)
- **Payment Gateway:** Mamo Pay API (for regional card processing and secure 48-hour escrow holds)
- **Logistics:** AJEX Courier API (for domestic shipping, automated label generation, and tracking status)
- **Platform Style:** Progressive Web App (PWA) optimized strictly for mobile viewport formats

## Code Style & Architecture
- **Type Safety:** TypeScript everywhere. No `any` types. Define clear interfaces for all component props.
- **Component Design:** Favor functional, declarative components. Avoid classes.
- **Layouts:** Use Tailwind CSS for fluid, responsive layouts. Keep files clean and modular.
- **Exports:** Prefer named exports (`export function Component()`) over default exports.

## Core Application Engines
1. **The "Make an Offer" Negotiation Engine:**
   - Add a 20% math floor on all customer offers. Users cannot type any offer less than 80% of listing price.
   - Enforce a 24-hour urgency countdown timer upon offer acceptance.
   - Provide a 3-button frictionless seller experience: Accept, Decline, Counter.
2. **The Mamo Pay Escrow Loop:**
   - Securely hold customer checkouts in escrow via Mamo Pay.
   - Payout is only triggered to the seller's wallet after a strict 48-hour inspection window post-delivery.
   - Automatically release funds to the seller's bank account if no dispute is opened within 48 hours.
3. **The AJEX Shipping Integration:**
   - Integrate AJEX API to auto-generate prepaid shipping labels in the seller's profile upon checkout.
   - Enforce a flat AED 20 shipping fee charged to the buyer, while utilizing your contracted AED 14 wholesale rate to pocket a net AED 6 logistics margin.

## Critical Design Guards (Impeccable Standards)
- **Zero AI Slop:** Strictly avoid purple-to-blue gradients, side-stripe card borders, and bloated nested card layouts.
- **No Pure Blacks/Whites:** Use warm-tinted neutrals (e.g., OKLCH colors with 0.005–0.01 chroma) to reduce eye strain.
- **Typography:** Never use overused default fonts like Inter or Arial. Use Plus Jakarta Sans, Figtree, or Instrument Sans.
- **No Bounce Easings:** All transitions must use smooth, physics-based exponential deceleration curves (like `ease-out-quart`).
- **Mobile First:** Prioritize fluid, responsive layouts tailored strictly for mobile viewport sizes.

---
Generated for Apex Swap | Version 1.0

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
