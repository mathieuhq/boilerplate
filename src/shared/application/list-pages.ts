import {
  MAX_PAGE_SIZE,
  type PaginatedResult,
} from "@/shared/domain/list-query";

export function iterateListPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<PaginatedResult<T>>,
  { pageSize = MAX_PAGE_SIZE, maxRows }: { pageSize?: number; maxRows: number },
): AsyncGenerator<T[]> {
  async function* iterateFrom(
    page: number,
    remaining: number,
  ): AsyncGenerator<T[]> {
    if (remaining <= 0) return;

    const result = await fetchPage(page, pageSize);
    const items = result.items.slice(0, remaining);

    if (items.length > 0) yield items;

    if (page >= result.pageCount || result.items.length < pageSize) return;

    yield* iterateFrom(page + 1, remaining - items.length);
  }

  return iterateFrom(1, maxRows);
}

type ListQueryDescriptionValue = string | number | boolean | string[];

export function describeListQuery(
  query: Record<string, unknown>,
): Record<string, ListQueryDescriptionValue> {
  const description: Record<string, ListQueryDescriptionValue> = {};

  for (const [key, value] of Object.entries(query)) {
    if (key === "page" || key === "pageSize") continue;
    if (!isDescriptionValue(value)) continue;

    description[key] = value;
  }

  return description;
}

function isDescriptionValue(
  value: unknown,
): value is ListQueryDescriptionValue {
  if (Array.isArray(value))
    return value.length > 0 && value.every((item) => typeof item === "string");

  if (typeof value === "string") return value.length > 0;

  return typeof value === "number" || typeof value === "boolean";
}
