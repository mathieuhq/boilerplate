import { AdminMetricCards } from "@/components/features/dashboard/admin/admin-metric-cards";
import { RegistrationsChart } from "@/components/features/dashboard/admin/registrations-chart";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { AdminOverviewMetricsDTO } from "@/features/admin/application/dto/admin-overview-metrics.dto";
import { useTranslations } from "@/i18n";

type DailyRegistrationStat = {
  date: string;
  count: number;
};

type AdminOverviewViewProps = {
  stats: DailyRegistrationStat[];
  metrics: AdminOverviewMetricsDTO;
};

export const AdminOverviewView = ({
  stats,
  metrics,
}: AdminOverviewViewProps) => {
  const t = useTranslations("admin");

  return (
    <PageLayout
      className="max-w-full"
      title={t("overview.title")}
      desc={t("overview.description")}
    >
      <div className="space-y-4">
        <AdminMetricCards metrics={metrics} />
        <RegistrationsChart stats={stats} />
      </div>
    </PageLayout>
  );
};
