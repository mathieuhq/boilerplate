import { RegistrationsChart } from "@/components/features/dashboard/admin/registrations-chart";
import { PageLayout } from "@/components/features/dashboard/page-layout";

type DailyRegistrationStat = {
  date: string;
  count: number;
};

type AdminOverviewViewProps = {
  stats: DailyRegistrationStat[];
};

export const AdminOverviewView = ({ stats }: AdminOverviewViewProps) => {
  return (
    <PageLayout
      title="Overview"
      className="max-w-full"
      desc="View registration statistics and platform metrics."
    >
      <RegistrationsChart stats={stats} />
    </PageLayout>
  );
};
