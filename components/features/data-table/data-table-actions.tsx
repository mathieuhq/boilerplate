import { Fragment, type ReactNode } from "react";
import { defaultStringifySearch, useLocation } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "@/i18n";

import type { DataTableAction } from "./data-table.types";

type DataTableActionsProps = {
  total: number;
  selectedCount: number;
  selectedIds?: string[];
  allSelected: boolean;
  canSelectAll: boolean;
  isFiltered: boolean;
  exportHref?: string;
  bulkActions: DataTableAction[];
  onSelectAll: () => void;
  onClearSelection: () => void;
};

export const DataTableActions = ({
  total,
  selectedCount,
  selectedIds,
  allSelected,
  canSelectAll,
  isFiltered,
  exportHref,
  bulkActions,
  onSelectAll,
  onClearSelection,
}: DataTableActionsProps) => {
  const t = useTranslations("dataTable");
  const search = useLocation({ select: (location) => location.search });
  const hasSelection = selectedCount > 0;

  const groups: { key: string; label: string; items: ReactNode }[] = [];

  if (hasSelection && bulkActions.length > 0)
    groups.push({
      key: "bulk",
      label: t("actions.bulk"),
      items: bulkActions.map((action) => (
        <DropdownMenuItem
          key={action.id}
          variant={action.variant}
          disabled={action.disabled}
          onSelect={action.onSelect}
        >
          {action.label}
        </DropdownMenuItem>
      )),
    });

  if (exportHref)
    groups.push({
      key: "export",
      label: t("actions.export"),
      items: (
        <>
          <DropdownMenuItem asChild>
            <a href={`${exportHref}${defaultStringifySearch(search)}`} download>
              {isFiltered
                ? t("actions.exportFiltered")
                : t("actions.exportAll")}
            </a>
          </DropdownMenuItem>
          {hasSelection ? (
            <DropdownMenuItem asChild>
              <a
                href={`${exportHref}${defaultStringifySearch(
                  selectedIds && selectedIds.length > 0
                    ? { ...search, ids: selectedIds }
                    : search,
                )}`}
                download
              >
                {t("actions.exportSelection", { count: selectedCount })}
              </a>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled>
              {t("actions.exportSelection", { count: 0 })}
            </DropdownMenuItem>
          )}
        </>
      ),
    });

  if (hasSelection)
    groups.push({
      key: "selection",
      label: allSelected
        ? t("selection.all", { count: total })
        : t("selection.count", { count: selectedCount }),
      items: (
        <>
          {canSelectAll && !allSelected && (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                onSelectAll();
              }}
            >
              {t("selection.selectAll", { count: total })}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={onClearSelection}>
            {t("selection.clear")}
          </DropdownMenuItem>
        </>
      ),
    });

  if (groups.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="w-full sm:w-auto">
          {t("actions.trigger")}
          {hasSelection && (
            <Badge variant="secondary" className="rounded-sm px-1 tabular-nums">
              {selectedCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {groups.map((group, index) => (
          <Fragment key={group.key}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground tabular-nums">
                {group.label}
              </DropdownMenuLabel>
              {group.items}
            </DropdownMenuGroup>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
