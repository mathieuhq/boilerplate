import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTranslations } from "@/i18n";
import { formatDate, formatShortDate } from "@/lib/utils";

type DailyRegistrationStat = {
  date: string;
  count: number;
};

type RegistrationsChartProps = {
  stats: DailyRegistrationStat[];
};

export const RegistrationsChart = ({ stats }: RegistrationsChartProps) => {
  const t = useTranslations("admin");

  const chartConfig = {
    registrations: {
      label: t("registrations"),
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  const chartData = stats.map((stat) => ({
    date: stat.date,
    registrations: stat.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("userRegistrations")}</CardTitle>
        <CardDescription>{t("registrationsDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-60 w-full">
          <LineChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickMargin={8}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: string) => formatShortDate(value)}
            />
            <YAxis
              tickMargin={8}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatDate(String(value))}
                />
              }
            />
            <Line
              dot={false}
              type="monotone"
              strokeWidth={2}
              dataKey="registrations"
              stroke="var(--color-registrations)"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
