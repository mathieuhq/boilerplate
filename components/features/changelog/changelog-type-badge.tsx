import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/i18n";
import type { ChangelogType } from "@/lib/changelog";
import { cn } from "@/lib/utils";

type ChangelogTypeBadgeProps = {
  type: ChangelogType;
  className?: string;
};

const typeStyles: Record<ChangelogType, string> = {
  Feature: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Fix: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Critical: "bg-red-500/10 text-red-600 border-red-500/20",
};

const typeTranslationKeys: Record<ChangelogType, string> = {
  Fix: "fixes",
  Critical: "critical",
  Feature: "newFeatures",
};

export const ChangelogTypeBadge = ({
  type,
  className,
}: ChangelogTypeBadgeProps) => {
  const t = useTranslations("changelog");

  return (
    <Badge variant="outline" className={cn(typeStyles[type], className)}>
      {t(typeTranslationKeys[type])}
    </Badge>
  );
};
