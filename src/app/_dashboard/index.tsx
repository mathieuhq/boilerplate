import { createFileRoute } from "@tanstack/react-router";

import { useTranslations } from "@/i18n";
import { getPageMetaTags } from "@/lib/seo";

export const Route = createFileRoute("/_dashboard/")({
  head: () => ({
    meta: getPageMetaTags("dashboard"),
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const t = useTranslations("navigation");

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
    </div>
  );
}
