import { AlertTriangle, Bug, LayersPlus, Sparkles } from "lucide-react";
import type { JSX } from "react";

import { SectionNavTemplate } from "@/components/features/dashboard/section-nav-template";
import { useTranslations } from "@/i18n";
import type { ChangelogType } from "@/lib/changelog";

type FilterItem = {
  value: ChangelogType | "all";
  labelKey: string;
  icon: JSX.Element;
};

const FILTER_ITEMS: FilterItem[] = [
  { value: "all", labelKey: "all", icon: <Sparkles /> },
  { value: "Feature", labelKey: "newFeatures", icon: <LayersPlus /> },
  { value: "Fix", labelKey: "fixes", icon: <Bug /> },
  { value: "Critical", labelKey: "critical", icon: <AlertTriangle /> },
];

type Props = {
  activeFilter: ChangelogType | "all";
  onFilterChange: (filter: ChangelogType | "all") => void;
};

export const ChangelogSidebar = ({ activeFilter, onFilterChange }: Props) => {
  const t = useTranslations("changelog");

  return (
    <SectionNavTemplate
      value={activeFilter}
      placeholder={t("filter")}
      onValueChange={(value) => onFilterChange(value as ChangelogType | "all")}
      items={FILTER_ITEMS.map((item) => ({
        value: item.value,
        label: t(item.labelKey),
        icon: item.icon,
      }))}
    />
  );
};
