import { type ReactNode, useState } from "react";
import { defaultStringifySearch, useLocation } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "@/i18n";

import {
  DataTableFilterControl,
  DataTableSearchInput,
  hasFilterValue,
} from "./data-table-filters";
import type {
  DataTableColumn,
  DataTableFilter,
  DataTableQuery,
} from "./data-table.types";

type DataTableToolbarProps<TData> = {
  query: DataTableQuery;
  columns: DataTableColumn<TData>[];
  hiddenColumns: Set<string>;
  filters: DataTableFilter[];
  searchPlaceholder?: string;
  exportHref?: string;
  selectedCount: number;
  selectedIds?: string[];
  actions?: ReactNode;
  onQueryChange: (patch: Record<string, unknown>) => void;
  onToggleColumn: (columnId: string, visible: boolean) => void;
};

export const DataTableToolbar = <TData,>({
  query,
  columns,
  hiddenColumns,
  filters,
  searchPlaceholder,
  exportHref,
  selectedCount,
  selectedIds,
  actions,
  onQueryChange,
  onToggleColumn,
}: DataTableToolbarProps<TData>) => {
  const t = useTranslations("dataTable");
  const search = useLocation({ select: (location) => location.search });
  const activeFilterCount = filters.filter((filter) =>
    hasFilterValue(query[filter.key]),
  ).length;
  const [filtersOpen, setFiltersOpen] = useState(activeFilterCount > 0);
  const isFiltered = hasFilterValue(query.search) || activeFilterCount > 0;
  const hideableColumns = columns.filter((column) => column.hideable !== false);

  return (
    <Collapsible
      open={filtersOpen}
      onOpenChange={setFiltersOpen}
      className="shrink-0 space-y-2"
    >
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between">
        <div className="contents sm:flex sm:flex-1 sm:flex-wrap sm:items-center sm:gap-2">
          {searchPlaceholder && (
            <DataTableSearchInput
              className="col-span-2 min-w-40 flex-1 sm:max-w-64"
              value={query.search}
              placeholder={searchPlaceholder}
              onChange={(search) => onQueryChange({ search })}
            />
          )}
          {filters.length > 0 && (
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="outline" className="w-full sm:w-auto">
                {t("filters.toggle")}
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="rounded-sm px-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
          )}
          {isFiltered && (
            <Button
              size="sm"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() =>
                onQueryChange({
                  search: undefined,
                  ...Object.fromEntries(
                    filters.map((filter) => [filter.key, undefined]),
                  ),
                })
              }
            >
              {t("filters.reset")}
            </Button>
          )}
        </div>
        <div className="contents sm:flex sm:flex-wrap sm:items-center sm:gap-2">
          {actions}
          {exportHref && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <a
                href={`${exportHref}${defaultStringifySearch(
                  selectedIds && selectedIds.length > 0
                    ? { ...search, ids: selectedIds }
                    : search,
                )}`}
                download
              >
                {selectedCount > 0
                  ? t("exportSelected", { count: selectedCount })
                  : t("export")}
              </a>
            </Button>
          )}
          {hideableColumns.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {t("columns")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{t("toggleColumns")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hideableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={!hiddenColumns.has(column.id)}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(checked) =>
                      onToggleColumn(column.id, checked)
                    }
                  >
                    {column.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {filters.length > 0 && (
        <CollapsibleContent className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-2 sm:flex sm:flex-wrap sm:items-center">
          {filters.map((filter) => (
            <DataTableFilterControl
              key={filter.key}
              filter={filter}
              value={query[filter.key]}
              onChange={(value) => onQueryChange({ [filter.key]: value })}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
};
