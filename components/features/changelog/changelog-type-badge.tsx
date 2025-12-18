import { Badge } from "@/components/ui/badge";
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

const typeLabels: Record<ChangelogType, string> = {
  Fix: "Fix",
  Critical: "Critical",
  Feature: "New Feature",
};

export function ChangelogTypeBadge({
  type,
  className,
}: ChangelogTypeBadgeProps) {
  return (
    <Badge variant="outline" className={cn(typeStyles[type], className)}>
      {typeLabels[type]}
    </Badge>
  );
}
