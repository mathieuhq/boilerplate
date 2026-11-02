export const SORT_DIRECTIONS = ["asc", "desc"] as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const DEFAULT_PAGE_SIZE = 20;

export const MAX_PAGE_SIZE = 100;

export const MAX_EXPORT_ROWS = 50_000;

export const EXPORT_BATCH_SIZE = 500;

export const DATE_RANGE_SEPARATOR = "..";

export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export type ListSort<TField extends string = string> = {
  field: TField;
  direction: SortDirection;
};

export type ListSortValue<TField extends string = string> =
  `${TField}.${SortDirection}`;

export type ListQuery<TSortField extends string = string> = {
  page: number;
  pageSize: number;
  sort?: ListSortValue<TSortField>;
  search?: string;
  ids?: string[];
};

export type ListSortField<TQuery extends ListQuery> = ExtractSortField<
  NonNullable<TQuery["sort"]>
>;

type ExtractSortField<TSort> = TSort extends `${infer TField}.${SortDirection}`
  ? TField
  : never;

export type ListFilters<TQuery extends ListQuery> = Omit<
  TQuery,
  keyof ListQuery
>;

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type DateRange = {
  from?: string;
  to?: string;
};

export type DateRangeBounds = {
  gte?: Date;
  lt?: Date;
};

export function parseListSort<TField extends string>(
  value: string | undefined,
  fields: readonly TField[],
): ListSort<TField> | null {
  if (!value) return null;

  const separatorIndex = value.lastIndexOf(".");

  if (separatorIndex < 1) return null;

  const field = value.slice(0, separatorIndex);
  const direction = value.slice(separatorIndex + 1);

  if (!fields.includes(field as TField)) return null;
  if (!SORT_DIRECTIONS.includes(direction as SortDirection)) return null;

  return { field: field as TField, direction: direction as SortDirection };
}

export function formatListSort<TField extends string>(
  sort: ListSort<TField>,
): ListSortValue<TField> {
  return `${sort.field}.${sort.direction}`;
}

export function parseDateRange(value: string | undefined): DateRange | null {
  if (!value) return null;

  const parts = value.split(DATE_RANGE_SEPARATOR);

  if (parts.length !== 2) return null;

  const [from, to] = parts;

  if (!from && !to) return null;
  if (from && !isIsoDay(from)) return null;
  if (to && !isIsoDay(to)) return null;
  if (from && to && from > to) return null;

  return { from: from || undefined, to: to || undefined };
}

export function formatDateRange(range: DateRange): string | undefined {
  if (!range.from && !range.to) return undefined;

  return `${range.from ?? ""}${DATE_RANGE_SEPARATOR}${range.to ?? ""}`;
}

export function toDateRangeBounds(range: DateRange): DateRangeBounds {
  const bounds: DateRangeBounds = {};

  if (range.from) bounds.gte = isoDayToUtcDate(range.from);

  if (range.to) {
    const end = isoDayToUtcDate(range.to);
    end.setUTCDate(end.getUTCDate() + 1);
    bounds.lt = end;
  }

  return bounds;
}

export function toIsoDay(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isoDayToLocalDate(day: string) {
  const [year, month, date] = day.split("-").map(Number);

  return new Date(year, month - 1, date);
}

export function toPaginatedResult<T>({
  items,
  total,
  page,
  pageSize,
}: {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function isoDayToUtcDate(day: string) {
  const [year, month, date] = day.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, date));
}

function isIsoDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = isoDayToUtcDate(value);

  return date.toISOString().slice(0, 10) === value;
}
