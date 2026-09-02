import { headers } from "next/headers";
import { isLocale, type Locale } from "./types";

export async function getRequestLocale(): Promise<Locale> {
  const value = (await headers()).get("x-locale");
  return isLocale(value) ? value : "en";
}
