import { WebsiteHome } from "@/components/web/WebsiteHome";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata("ar");

export default function ArabicHomePage() {
  return <WebsiteHome locale="ar" t={getDictionary("ar")} />;
}
