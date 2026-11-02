import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "@/i18n";

import type { DataTableAction } from "./data-table.types";

export const DataTableRowActions = ({
  actions,
}: {
  actions: DataTableAction[];
}) => {
  const t = useTranslations("dataTable");
  const regular = actions.filter((action) => action.variant !== "destructive");
  const destructive = actions.filter(
    (action) => action.variant === "destructive",
  );

  if (actions.length === 0) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          title={t("rowActions")}
          aria-label={t("rowActions")}
          className="data-[state=open]:bg-accent"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {regular.map((action) => (
          <DataTableRowActionItem key={action.id} action={action} />
        ))}
        {regular.length > 0 && destructive.length > 0 && (
          <DropdownMenuSeparator />
        )}
        {destructive.map((action) => (
          <DataTableRowActionItem key={action.id} action={action} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DataTableRowActionItem = ({ action }: { action: DataTableAction }) => (
  <DropdownMenuItem
    variant={action.variant}
    disabled={action.disabled}
    onSelect={action.onSelect}
  >
    {action.label}
  </DropdownMenuItem>
);
