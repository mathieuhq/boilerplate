import {
  Building2,
  CalendarDays,
  MailQuestion,
  ShieldBan,
  UserRound,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminOverviewMetricsDTO } from "@/features/admin/application/dto/admin-overview-metrics.dto";
import { useTranslations } from "@/i18n";

type AdminMetricCardsProps = {
  metrics: AdminOverviewMetricsDTO;
};

export const AdminMetricCards = ({ metrics }: AdminMetricCardsProps) => {
  const t = useTranslations("admin");

  const cards = [
    {
      label: t("overview.metrics.totalUsers"),
      value: metrics.totalUsers,
      icon: UserRound,
    },
    {
      label: t("overview.metrics.newUsers7d"),
      value: metrics.newUsersLast7Days,
      icon: CalendarDays,
    },
    {
      label: t("overview.metrics.newUsers30d"),
      value: metrics.newUsersLast30Days,
      icon: Users,
    },
    {
      label: t("overview.metrics.organizations"),
      value: metrics.totalOrganizations,
      icon: Building2,
    },
    {
      label: t("overview.metrics.pendingInvitations"),
      value: metrics.pendingInvitations,
      icon: MailQuestion,
    },
    {
      label: t("overview.metrics.bannedUsers"),
      value: metrics.bannedUsers,
      icon: ShieldBan,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {card.label}
            </CardTitle>
            <card.icon className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
