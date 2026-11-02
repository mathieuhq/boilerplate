import { createFileRoute } from "@tanstack/react-router";

import { SectionTemplate } from "@/components/features/dashboard/section-template";
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

  return <SectionTemplate title={t("dashboard")} />;
}
