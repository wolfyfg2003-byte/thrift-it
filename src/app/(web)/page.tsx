import { WebsiteHome } from "@/components/web/WebsiteHome";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata("en");

export default function WebsiteHomePage() {
  return <WebsiteHome locale="en" t={getDictionary("en")} />;
}
