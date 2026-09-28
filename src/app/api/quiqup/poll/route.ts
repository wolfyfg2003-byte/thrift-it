import { pollOpenCourierHolds } from "@/lib/rail-quiqup";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function authorized(request: Request): boolean {
  const cron = request.headers.get("x-vercel-cron");
  if (cron === "1") return true;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return false;
  const secrets = [
    process.env.CRON_SECRET,
    process.env.QUIQUP_WEBHOOK_SECRET,
    process.env.APP_SUPABASE_SECRET_KEY,
  ]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean);
  return secrets.includes(token);
}

function admin() {
  const url = process.env.APP_SUPABASE_URL;
  const secret = process.env.APP_SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Could not reach the rail.");
  return createClient(url, secret, { auth: { persistSession: false } });
}

async function poll(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const result = await pollOpenCourierHolds(admin());
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: Request) {
  return poll(request);
}

export async function POST(request: Request) {
  return poll(request);
}
