import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getPageMetadata("dashboard");

export default async function DashboardPage() {
  const t = await getTranslations("navigation");

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
    </div>
  );
}
