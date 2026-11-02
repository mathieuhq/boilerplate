import {
  type DateRangeBounds,
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

type SortBuilder<TOrderBy> = string | ((direction: SortDirection) => TOrderBy);

type FilterBuilders<TQuery extends ListQuery, TWhere> = {
  [TKey in keyof ListFilters<TQuery>]?: (
    value: NonNullable<ListFilters<TQuery>[TKey]>,
  ) => TWhere | undefined;
};

export type PrismaListConfig<
  TQuery extends ListQuery,
  TWhere extends object,
  TOrderBy extends object,
> = {
  sortable: Record<ListSortField<TQuery>, SortBuilder<TOrderBy>>;
  defaultSort: ListSort<ListSortField<TQuery>>;
  tieBreaker?: TOrderBy;
  where?: TWhere;
  search?: (term: string) => TWhere | undefined;
  filters?: FilterBuilders<TQuery, TWhere>;
  maxPageSize?: number;
};

export type PrismaListArgs<TWhere, TOrderBy> = {
  where: TWhere;
  orderBy: TOrderBy[];
  skip: number;
  take: number;
  page: number;
  pageSize: number;
};

export function toPrismaListArgs<
  TQuery extends ListQuery,
  TWhere extends object,
  TOrderBy extends object,
>(
  query: TQuery,
  config: PrismaListConfig<TQuery, TWhere, TOrderBy>,
): PrismaListArgs<TWhere, TOrderBy> {
  const page = Math.max(1, Math.trunc(query.page) || 1);
  const pageSize = Math.min(
    config.maxPageSize ?? MAX_PAGE_SIZE,
    Math.max(1, Math.trunc(query.pageSize) || 1),
  );

  return {
    page,
    pageSize,
    where: toPrismaWhere(query, config),
    orderBy: toPrismaOrderBy(query, config),
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

function toPrismaWhere<
  TQuery extends ListQuery,
  TWhere extends object,
  TOrderBy extends object,
>(query: TQuery, config: PrismaListConfig<TQuery, TWhere, TOrderBy>): TWhere {
  const clauses: TWhere[] = [];

  if (config.where) clauses.push(config.where);

  if (query.ids && query.ids.length > 0)
    clauses.push({ id: { in: query.ids } } as TWhere);

  const search = query.search?.trim();

  if (search && config.search) {
    const clause = config.search(search);

    if (clause) clauses.push(clause);
  }

  const builders = (config.filters ?? {}) as Record<
    string,
    ((value: unknown) => TWhere | undefined) | undefined
  >;

  for (const [key, build] of Object.entries(builders)) {
    const value = (query as Record<string, unknown>)[key];

    if (!build || isEmptyFilterValue(value)) continue;

    const clause = build(value);

    if (clause) clauses.push(clause);
  }

  if (clauses.length === 0) return {} as TWhere;
  if (clauses.length === 1) return clauses[0];

  return { AND: clauses } as TWhere;
}

function toPrismaOrderBy<
  TQuery extends ListQuery,
  TWhere extends object,
  TOrderBy extends object,
>(
  query: TQuery,
  config: PrismaListConfig<TQuery, TWhere, TOrderBy>,
): TOrderBy[] {
  const sortable = config.sortable as Record<string, SortBuilder<TOrderBy>>;
  const sort =
    parseListSort(query.sort, Object.keys(sortable)) ?? config.defaultSort;
  const build = sortable[sort.field];
  const primary =
    typeof build === "function"
      ? build(sort.direction)
      : ({ [build]: sort.direction } as TOrderBy);

  return config.tieBreaker ? [primary, config.tieBreaker] : [primary];
}

export function containsInsensitive(value: string) {
  return { contains: value, mode: "insensitive" as const };
}

export function toPrismaDateRange(value: string): DateRangeBounds | undefined {
  const range = parseDateRange(value);

  if (!range) return undefined;

  return toDateRangeBounds(range);
}

function isEmptyFilterValue(value: unknown) {
  if (value === undefined || value === null || value === "") return true;

  return Array.isArray(value) && value.length === 0;
}
