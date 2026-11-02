import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { Download, Settings2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  actions,
  onQueryChange,
  onToggleColumn,
}: DataTableToolbarProps<TData>) => {
  const t = useTranslations("dataTable");
  const searchStr = useLocation({ select: (location) => location.searchStr });
  const isFiltered =
    hasFilterValue(query.search) ||
    filters.some((filter) => hasFilterValue(query[filter.key]));
  const hideableColumns = columns.filter((column) => column.hideable !== false);

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {searchPlaceholder && (
          <DataTableSearchInput
            className="w-full sm:w-64"
            value={query.search}
            placeholder={searchPlaceholder}
            onChange={(search) => onQueryChange({ search })}
          />
        )}
        {filters.map((filter) => (
          <DataTableFilterControl
            key={filter.key}
            filter={filter}
            value={query[filter.key]}
            onChange={(value) => onQueryChange({ [filter.key]: value })}
          />
        ))}
        {isFiltered && (
          <Button
            size="sm"
            variant="ghost"
            className="self-start sm:self-auto"
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
            <X />
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        {exportHref && (
          <Button asChild size="sm" variant="outline">
            <a href={`${exportHref}${searchStr}`} download>
              <Download />
              {t("export")}
            </a>
          </Button>
        )}
        {hideableColumns.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Settings2 />
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
  );
};
