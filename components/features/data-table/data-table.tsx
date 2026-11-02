import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Inbox,
  RotateCcw,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  formatListSort,
  type ListSort,
  parseListSort,
} from "@/shared/domain/list-query";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import type { DataTableColumn, DataTableProps } from "./data-table.types";
import {
  useDataTableNavigation,
  useDataTablePending,
} from "./use-data-table-navigation";

const MAX_SKELETON_ROWS = 10;

const DEFAULT_SKELETON_ROWS = 5;

const COLUMN_VISIBILITY_EVENT = "data-table-columns-change";

const EMPTY_SELECTION = new Set<string>();

const memoryColumnVisibility = new Map<string, string>();

export const DataTable = <TData,>({
  id,
  columns,
  query,
  result,
  getRowId,
  filters = [],
  defaultSort,
  searchPlaceholder,
  exportHref,
  emptyMessage,
  toolbar,
  bulkActions,
  onRetry,
}: DataTableProps<TData>) => {
  const t = useTranslations("dataTable");
  const router = useRouter();
  const navigate = useDataTableNavigation();
  const isPending = useDataTablePending();
  const [hiddenColumns, setColumnVisible] = useColumnVisibility(id, columns);
  const rows = useMemo(() => result?.items ?? [], [result]);
  const [selection, setSelection] = useState(() => ({
    rows,
    ids: new Set<string>(),
  }));
  const selectedIds = selection.rows === rows ? selection.ids : EMPTY_SELECTION;
  const visibleColumns = columns.filter(
    (column) => !hiddenColumns.has(column.id),
  );
  const selectable = Boolean(bulkActions);
  const columnCount = visibleColumns.length + (selectable ? 1 : 0);
  const sortFields = columns
    .filter((column) => column.sortable)
    .map((column) => column.id);
  const sort =
    parseListSort(query.sort, sortFields) ??
    parseListSort(defaultSort, sortFields);
  const selectedRows = rows.filter((row) => selectedIds.has(getRowId(row)));
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;

  const setSelectedIds = (update: (current: Set<string>) => Set<string>) =>
    setSelection((current) => ({
      rows,
      ids: update(current.rows === rows ? current.ids : EMPTY_SELECTION),
    }));

  const clearSelection = () => setSelectedIds(() => new Set());

  const toggleRow = (rowId: string, checked: boolean) =>
    setSelectedIds((current) => {
      const next = new Set(current);

      if (checked) next.add(rowId);
      else next.delete(rowId);

      return next;
    });

  return (
    <div className="space-y-3">
      <DataTableToolbar
        query={query}
        columns={columns}
        filters={filters}
        actions={toolbar}
        exportHref={exportHref}
        hiddenColumns={hiddenColumns}
        searchPlaceholder={searchPlaceholder}
        onQueryChange={(patch) => void navigate(patch)}
        onToggleColumn={setColumnVisible}
      />
      {bulkActions && selectedRows.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium">
            {t("selection.count", { count: selectedRows.length })}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions({ rows: selectedRows, clearSelection })}
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              <X />
              {t("selection.clear")}
            </Button>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-lg border">
        <Table aria-busy={isPending}>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {selectable && (
                <TableHead className="w-10 px-4">
                  <Checkbox
                    aria-label={t("selection.selectPage")}
                    disabled={rows.length === 0}
                    checked={
                      allSelected
                        ? true
                        : selectedRows.length > 0
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={(checked) =>
                      setSelectedIds(() =>
                        checked === true
                          ? new Set(rows.map(getRowId))
                          : new Set(),
                      )
                    }
                  />
                </TableHead>
              )}
              {visibleColumns.map((column) => (
                <DataTableColumnHeader
                  key={column.id}
                  column={column}
                  sort={sort}
                  isDefaultSort={!query.sort}
                  onSortChange={(next) =>
                    void navigate({
                      sort: next ? formatListSort(next) : undefined,
                    })
                  }
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result === null ? (
              <DataTableMessageRow
                columnCount={columnCount}
                icon={<AlertCircle className="size-5 text-destructive" />}
                message={t("error")}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (onRetry) onRetry();
                      else void router.invalidate();
                    }}
                  >
                    <RotateCcw />
                    {t("retry")}
                  </Button>
                }
              />
            ) : isPending ? (
              <DataTableSkeletonRows
                columnCount={columnCount}
                rowCount={Math.min(
                  MAX_SKELETON_ROWS,
                  rows.length || DEFAULT_SKELETON_ROWS,
                )}
              />
            ) : rows.length === 0 ? (
              <DataTableMessageRow
                columnCount={columnCount}
                icon={<Inbox className="size-5 text-muted-foreground" />}
                message={emptyMessage ?? t("empty")}
              />
            ) : (
              rows.map((row) => {
                const rowId = getRowId(row);
                const isSelected = selectedIds.has(rowId);

                return (
                  <TableRow
                    key={rowId}
                    data-state={isSelected ? "selected" : undefined}
                  >
                    {selectable && (
                      <TableCell className="w-10 px-4 py-3">
                        <Checkbox
                          checked={isSelected}
                          aria-label={t("selection.selectRow")}
                          onCheckedChange={(checked) =>
                            toggleRow(rowId, checked === true)
                          }
                        />
                      </TableCell>
                    )}
                    {visibleColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          "px-4 py-3",
                          column.align === "right" && "text-right",
                          column.cellClassName,
                        )}
                      >
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {result && (
        <DataTablePagination
          page={result.page}
          total={result.total}
          pageSize={result.pageSize}
          pageCount={result.pageCount}
          selectedCount={selectedRows.length}
          onPageChange={(page) => void navigate({ page }, { resetPage: false })}
          onPageSizeChange={(pageSize) => void navigate({ pageSize })}
        />
      )}
    </div>
  );
};

const DataTableColumnHeader = <TData,>({
  column,
  sort,
  isDefaultSort,
  onSortChange,
}: {
  column: DataTableColumn<TData>;
  sort: ListSort | null;
  isDefaultSort: boolean;
  onSortChange: (sort: ListSort | null) => void;
}) => {
  const t = useTranslations("dataTable.sort");
  const direction = sort?.field === column.id ? sort.direction : null;
  const className = cn("px-4", column.align === "right" && "text-right");

  if (!column.sortable)
    return <TableHead className={className}>{column.header}</TableHead>;

  const nextSort: ListSort | null =
    direction === null
      ? { field: column.id, direction: "asc" }
      : isDefaultSort
        ? {
            field: column.id,
            direction: direction === "asc" ? "desc" : "asc",
          }
        : direction === "asc"
          ? { field: column.id, direction: "desc" }
          : null;

  return (
    <TableHead
      className={className}
      aria-sort={
        direction === "asc"
          ? "ascending"
          : direction === "desc"
            ? "descending"
            : "none"
      }
    >
      <Button
        size="sm"
        variant="ghost"
        className={cn(
          "-mx-3 h-8 data-[active=true]:text-foreground",
          column.align === "right" && "flex-row-reverse",
        )}
        data-active={direction !== null}
        title={
          nextSort
            ? t(nextSort.direction === "asc" ? "ascending" : "descending")
            : t("reset")
        }
        onClick={() => onSortChange(nextSort)}
      >
        {column.header}
        {direction === "asc" ? (
          <ArrowUp />
        ) : direction === "desc" ? (
          <ArrowDown />
        ) : (
          <ChevronsUpDown className="opacity-50" />
        )}
      </Button>
    </TableHead>
  );
};

const DataTableSkeletonRows = ({
  columnCount,
  rowCount,
}: {
  columnCount: number;
  rowCount: number;
}) =>
  Array.from({ length: rowCount }, (_, rowIndex) => (
    <TableRow key={rowIndex} className="hover:bg-transparent">
      {Array.from({ length: columnCount }, (_, cellIndex) => (
        <TableCell key={cellIndex} className="px-4 py-3">
          <Skeleton className={cn("h-5", cellIndex === 0 ? "w-40" : "w-24")} />
        </TableCell>
      ))}
    </TableRow>
  ));

const DataTableMessageRow = ({
  columnCount,
  icon,
  message,
  action,
}: {
  columnCount: number;
  icon: React.ReactNode;
  message: string;
  action?: React.ReactNode;
}) => (
  <TableRow className="hover:bg-transparent">
    <TableCell colSpan={columnCount} className="h-40 px-4 text-center">
      <div className="flex flex-col items-center justify-center gap-3 whitespace-normal">
        {icon}
        <p className="text-sm text-muted-foreground">{message}</p>
        {action}
      </div>
    </TableCell>
  </TableRow>
);

function useColumnVisibility<TData>(
  id: string,
  columns: DataTableColumn<TData>[],
) {
  const storageKey = `data-table:${id}:hidden-columns`;
  const stored = useSyncExternalStore(
    subscribeToColumnVisibility,
    () => readColumnVisibility(storageKey),
    () => null,
  );

  const hiddenColumns = useMemo(() => {
    const parsed = parseColumnVisibility(stored);

    if (parsed) return parsed;

    return new Set(
      columns
        .filter((column) => column.defaultHidden)
        .map((column) => column.id),
    );
  }, [columns, stored]);

  const setColumnVisible = (columnId: string, visible: boolean) => {
    const next = new Set(hiddenColumns);

    if (visible) next.delete(columnId);
    else next.add(columnId);

    writeColumnVisibility(storageKey, JSON.stringify([...next]));
  };

  return [hiddenColumns, setColumnVisible] as const;
}

function subscribeToColumnVisibility(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COLUMN_VISIBILITY_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLUMN_VISIBILITY_EVENT, onChange);
  };
}

function readColumnVisibility(storageKey: string) {
  try {
    return (
      window.localStorage.getItem(storageKey) ??
      memoryColumnVisibility.get(storageKey) ??
      null
    );
  } catch {
    return memoryColumnVisibility.get(storageKey) ?? null;
  }
}

function writeColumnVisibility(storageKey: string, value: string) {
  memoryColumnVisibility.set(storageKey, value);

  try {
    window.localStorage.setItem(storageKey, value);
  } catch {
    return window.dispatchEvent(new Event(COLUMN_VISIBILITY_EVENT));
  }

  window.dispatchEvent(new Event(COLUMN_VISIBILITY_EVENT));
}

function parseColumnVisibility(value: string | null) {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) return null;

    return new Set(parsed.filter((item) => typeof item === "string"));
  } catch {
    return null;
  }
}
