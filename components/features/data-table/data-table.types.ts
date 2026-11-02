import type { ReactNode } from "react";

import type { PaginatedResult } from "@/shared/domain/list-query";

export type DataTableColumn<TData> = {
  id: string;
  header: string;
  cell: (row: TData) => ReactNode;
  sortable?: boolean;
  hideable?: boolean;
  defaultHidden?: boolean;
  cellClassName?: string;
  align?: "left" | "center" | "right";
};

export type DataTableFilterValue = string | boolean;

export type DataTableFilterOption = {
  label: string;
  value: DataTableFilterValue;
};

type DataTableOptionsFilter<TType extends "select" | "multiSelect"> = {
  type: TType;
  key: string;
  label: string;
  options: DataTableFilterOption[];
};

export type DataTableFilter =
  | DataTableOptionsFilter<"select">
  | DataTableOptionsFilter<"multiSelect">
  | {
      type: "text";
      key: string;
      label: string;
      placeholder?: string;
    }
  | {
      type: "dateRange";
      key: string;
      label: string;
    };

export type DataTableQuery = {
  page: number;
  pageSize: number;
  sort?: string;
  search?: string;
  [key: string]: unknown;
};

export type DataTableAction = {
  id: string;
  label: string;
  disabled?: boolean;
  variant?: "default" | "destructive";
  onSelect: () => void;
};

type DataTableBulkActionsContext<TData> = {
  rows: TData[];
  clearSelection: () => void;
};

export type DataTableProps<TData> = {
  id: string;
  columns: DataTableColumn<TData>[];
  query: DataTableQuery;
  result: PaginatedResult<TData> | null;
  getRowId: (row: TData) => string;
  filters?: DataTableFilter[];
  defaultSort?: string;
  searchPlaceholder?: string;
  exportHref?: string;
  emptyMessage?: string;
  toolbar?: ReactNode;
  bulkActions?: (
    context: DataTableBulkActionsContext<TData>,
  ) => DataTableAction[];
  onRetry?: () => void;
};
