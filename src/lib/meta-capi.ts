import { createHash } from "crypto";
import { cookies, headers } from "next/headers";
import { META_PIXEL_ID } from "@/lib/meta-pixel";
import { SITE_URL } from "@/lib/seo";

type CapiLeadInput = {
  eventName: "Lead";
  eventId: string;
  email: string;
  phone?: string | null;
};

type CapiPageViewInput = {
  eventName: "PageView";
  eventId: string;
};

export type MetaCapiVisitor = {
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  sourceUrl: string;
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function accessToken(): string {
  return (process.env.META_CAPI_ACCESS_TOKEN ?? "").trim();
}

function hashEmail(email: string): string {
  return sha256(email.trim().toLowerCase());
}

function hashPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const e164 = digits.startsWith("971") ? digits : `971${digits.replace(/^0+/, "")}`;
  return sha256(e164);
}

async function visitorContext(): Promise<MetaCapiVisitor> {
  const headerList = await headers();
  const jar = await cookies();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || undefined;
  const pathname = headerList.get("x-pathname") || "/";
  return {
    ip,
    userAgent: headerList.get("user-agent") || undefined,
    fbp: jar.get("_fbp")?.value,
    fbc: jar.get("_fbc")?.value,
    sourceUrl: `${SITE_URL}${pathname === "/" ? "/" : pathname}`,
  };
}

export async function captureMetaCapiVisitor(): Promise<MetaCapiVisitor | undefined> {
  try {
    return await visitorContext();
  } catch {
    return undefined;
  }
}

/** Browser pixel is not enough for Ads Manager “active”. Server events need META_CAPI_ACCESS_TOKEN. */
export async function sendMetaCapiEvent(
  input: CapiLeadInput | CapiPageViewInput,
  visitor?: MetaCapiVisitor,
): Promise<void> {
  const token = accessToken();
  if (!token || !META_PIXEL_ID) return;

  const resolved = visitor ?? (await captureMetaCapiVisitor());
  const sourceUrl = resolved?.sourceUrl ?? `${SITE_URL}/`;
  const userData: Record<string, string | string[]> = {};
  if (resolved?.ip) userData.client_ip_address = resolved.ip;
  if (resolved?.userAgent) userData.client_user_agent = resolved.userAgent;
  if (resolved?.fbp) userData.fbp = resolved.fbp;
  if (resolved?.fbc) userData.fbc = resolved.fbc;

  if (input.eventName === "Lead") {
    userData.em = [hashEmail(input.email)];
    const phoneHash = input.phone ? hashPhone(input.phone) : null;
    if (phoneHash) userData.ph = [phoneHash];
  }

  const payload = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: sourceUrl,
        user_data: userData,
        custom_data:
          input.eventName === "Lead"
            ? { content_name: "waitlist" }
            : undefined,
      },
    ],
  };

  const url = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("meta capi failed", response.status);
    }
  } catch (cause) {
    console.error("meta capi threw", cause);
  }
}
