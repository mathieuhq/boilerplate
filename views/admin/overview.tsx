import { RegistrationsChart } from "@/components/features/dashboard/admin/registrations-chart";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import { useTranslations } from "@/i18n";

type DailyRegistrationStat = {
  date: string;
  count: number;
};

type AdminOverviewViewProps = {
  stats: DailyRegistrationStat[];
};

export const AdminOverviewView = ({ stats }: AdminOverviewViewProps) => {
  const t = useTranslations("admin");

  return (
    <PageLayout
      className="max-w-full"
      title={t("overview.title")}
      desc={t("overview.description")}
    >
      <RegistrationsChart stats={stats} />
    </PageLayout>
  );
};
