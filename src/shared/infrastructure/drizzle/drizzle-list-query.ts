import {
  type AnyColumn,
  and,
  asc,
  desc,
  gte,
  ilike,
  inArray,
  lt,
  type SQL,
  sql,
} from "drizzle-orm";

import {
  type ListFilters,
  type ListQuery,
  type ListSort,
  type ListSortField,
  MAX_PAGE_SIZE,
  parseDateRange,
  parseListSort,
  type SortDirection,
  toDateRangeBounds,
} from "@/shared/domain/list-query";

type SortBuilder = AnyColumn | ((direction: SortDirection) => SQL);

type FilterBuilders<TQuery extends ListQuery> = {
  [TKey in keyof ListFilters<TQuery>]?: (
    value: NonNullable<ListFilters<TQuery>[TKey]>,
  ) => SQL | undefined;
};

export type DrizzleListConfig<TQuery extends ListQuery> = {
  id: AnyColumn;
  sortable: Record<ListSortField<TQuery>, SortBuilder>;
  defaultSort: ListSort<ListSortField<TQuery>>;
  tieBreaker?: SQL;
  where?: SQL;
  search?: (term: string) => SQL | undefined;
  filters?: FilterBuilders<TQuery>;
  maxPageSize?: number;
};

export type DrizzleListArgs = {
  where: SQL | undefined;
  orderBy: SQL[];
  offset: number;
  limit: number;
  page: number;
  pageSize: number;
};

export function toDrizzleListArgs<TQuery extends ListQuery>(
  query: TQuery,
  config: DrizzleListConfig<TQuery>,
): DrizzleListArgs {
  const page = Math.max(1, Math.trunc(query.page) || 1);
  const pageSize = Math.min(
    config.maxPageSize ?? MAX_PAGE_SIZE,
    Math.max(1, Math.trunc(query.pageSize) || 1),
  );

  return {
    page,
    pageSize,
    where: toDrizzleWhere(query, config),
    orderBy: toDrizzleOrderBy(query, config),
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
}

function toDrizzleWhere<TQuery extends ListQuery>(
  query: TQuery,
  config: DrizzleListConfig<TQuery>,
): SQL | undefined {
  const clauses: SQL[] = [];

  if (config.where) clauses.push(config.where);

  if (query.ids && query.ids.length > 0)
    clauses.push(inArray(config.id, query.ids));

  const search = query.search?.trim();

  if (search && config.search) {
    const clause = config.search(search);

    if (clause) clauses.push(clause);
  }

  const builders = (config.filters ?? {}) as Record<
    string,
    ((value: unknown) => SQL | undefined) | undefined
  >;

  for (const [key, build] of Object.entries(builders)) {
    const value = (query as Record<string, unknown>)[key];

    if (!build || isEmptyFilterValue(value)) continue;

    const clause = build(value);

    if (clause) clauses.push(clause);
  }

  if (clauses.length <= 1) return clauses[0];

  return and(...clauses);
}

function toDrizzleOrderBy<TQuery extends ListQuery>(
  query: TQuery,
  config: DrizzleListConfig<TQuery>,
): SQL[] {
  const sortable = config.sortable as Record<string, SortBuilder>;
  const sort =
    parseListSort(query.sort, Object.keys(sortable)) ?? config.defaultSort;
  const build = sortable[sort.field];
  const primary =
    typeof build === "function"
      ? build(sort.direction)
      : (sort.direction === "asc" ? asc : desc)(build);

  return config.tieBreaker ? [primary, config.tieBreaker] : [primary];
}

export function sortNullsLast(column: AnyColumn) {
  return (direction: SortDirection) =>
    sql`${column} ${sql.raw(direction === "asc" ? "asc" : "desc")} nulls last`;
}

export function containsInsensitive(column: AnyColumn, value: string) {
  return ilike(column, `%${value.replace(/[\\%_]/g, "\\$&")}%`);
}

export function toDateRangeWhere(
  column: AnyColumn,
  value: string,
): SQL | undefined {
  const range = parseDateRange(value);

  if (!range) return undefined;

  const bounds = toDateRangeBounds(range);

  return and(
    bounds.gte && gte(column, bounds.gte),
    bounds.lt && lt(column, bounds.lt),
  );
}

function isEmptyFilterValue(value: unknown) {
  if (value === undefined || value === null || value === "") return true;

  return Array.isArray(value) && value.length === 0;
}
