import { getTranslations } from "next-intl/server";

import { RegistrationsChart } from "@/components/features/dashboard/admin/registrations-chart";
import { PageLayout } from "@/components/features/dashboard/page-layout";

type DailyRegistrationStat = {
  date: string;
  count: number;
};

type AdminOverviewViewProps = {
  stats: DailyRegistrationStat[];
};

export const AdminOverviewView = async ({ stats }: AdminOverviewViewProps) => {
  const t = await getTranslations("admin");

  return (
    <PageLayout
      title={t("overview.title")}
      className="max-w-full"
      desc={t("overview.description")}
    >
      <RegistrationsChart stats={stats} />
    </PageLayout>
  );
};
