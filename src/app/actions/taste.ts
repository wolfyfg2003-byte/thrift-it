"use server";

import { isProduction } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabaseClient";
import {
  applyTasteWeights,
  buildInitialTaste,
  EMPTY_TASTE,
  rankListingsByTaste,
  type TasteEvent,
  type TastePreferences,
} from "@/lib/taste";
import { listListings, type Listing } from "@/lib/listings";

export type TasteActionResult =
  | { ok: true; skipped?: "teaser" | "no_session" }
  | { ok: false; error: string };

function asTaste(value: unknown): TastePreferences {
  if (!value || typeof value !== "object") return { ...EMPTY_TASTE };
  const raw = value as Partial<TastePreferences>;
  return {
    sizes: Array.isArray(raw.sizes)
      ? raw.sizes.filter((item): item is string => typeof item === "string")
      : [],
    brands:
      raw.brands && typeof raw.brands === "object" && !Array.isArray(raw.brands)
        ? Object.fromEntries(
            Object.entries(raw.brands).filter(
              (entry): entry is [string, number] => typeof entry[1] === "number",
            ),
          )
        : {},
    categories:
      raw.categories &&
      typeof raw.categories === "object" &&
      !Array.isArray(raw.categories)
        ? Object.fromEntries(
            Object.entries(raw.categories).filter(
              (entry): entry is [string, number] => typeof entry[1] === "number",
            ),
          )
        : {},
  };
}

async function readSessionUserId(): Promise<string | null> {
  // Production Auth session is not wired yet. Taste writes stay no-ops until then.
  return null;
}

export async function saveTastePreferences(input: {
  sizes?: string[];
  brands: string[];
  aesthetics?: string[];
}): Promise<TasteActionResult> {
  if (!isProduction()) return { ok: true, skipped: "teaser" };

  const userId = await readSessionUserId();
  if (!userId) return { ok: true, skipped: "no_session" };

  const prefs = buildInitialTaste(
    input.sizes ?? [],
    input.brands,
    input.aesthetics ?? [],
  );
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ taste_preferences: prefs })
    .eq("id", userId);

  if (error) {
    console.error("saveTastePreferences failed", error.message);
    return { ok: false, error: "Could not save taste preferences." };
  }
  return { ok: true };
}

export async function applyTasteEvent(input: {
  brand: string;
  category: string;
  event: TasteEvent;
  listingId?: string;
}): Promise<TasteActionResult> {
  if (!isProduction()) return { ok: true, skipped: "teaser" };

  const userId = await readSessionUserId();
  if (!userId) return { ok: true, skipped: "no_session" };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("taste_preferences")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("applyTasteEvent read failed", error.message);
    return { ok: false, error: "Could not update taste." };
  }

  const next = applyTasteWeights(
    asTaste(data?.taste_preferences),
    input.brand,
    input.category,
    input.event,
  );

  const { error: writeError } = await supabase
    .from("profiles")
    .update({ taste_preferences: next })
    .eq("id", userId);

  if (writeError) {
    console.error("applyTasteEvent write failed", writeError.message);
    return { ok: false, error: "Could not update taste." };
  }

  if (input.listingId && (input.event === "like" || input.event === "pass")) {
    await supabase.from("swipes").upsert(
      {
        user_id: userId,
        listing_id: input.listingId,
        direction: input.event,
      },
      { onConflict: "user_id,listing_id" },
    );
  }

  return { ok: true };
}

export async function listCuratedDeck(): Promise<Listing[]> {
  const catalog = await listListings();
  if (!isProduction()) return catalog;

  const userId = await readSessionUserId();
  if (!userId) return catalog;

  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("taste_preferences")
    .eq("id", userId)
    .maybeSingle();

  const prefs = asTaste(profile?.taste_preferences);
  if (!Object.keys(prefs.brands).length && !Object.keys(prefs.categories).length) {
    return catalog;
  }

  const { data: swipes } = await supabase
    .from("swipes")
    .select("listing_id")
    .eq("user_id", userId);

  const swipedIds = new Set((swipes ?? []).map((row) => row.listing_id));

  return rankListingsByTaste(catalog, prefs, swipedIds);
}
