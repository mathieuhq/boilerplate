import { z } from "zod";

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  parseDateRange,
  SORT_DIRECTIONS,
} from "@/shared/domain/list-query";

const MAX_TEXT_LENGTH = 200;

function toText(value: unknown) {
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);

  if (typeof value !== "string") return undefined;

  const trimmed = value.trim().slice(0, MAX_TEXT_LENGTH);

  return trimmed.length > 0 ? trimmed : undefined;
}

function toTextList(value: unknown, allowed?: readonly string[]) {
  const values = (Array.isArray(value) ? value : [value])
    .map(toText)
    .filter((item): item is string => item !== undefined)
    .filter((item) => !allowed || allowed.includes(item));
  const unique = [...new Set(values)];

  return unique.length > 0 ? unique : undefined;
}

function text() {
  return z.preprocess(toText, z.string().optional()).catch(undefined);
}

function select<const TValue extends string>(values: readonly TValue[]) {
  return z
    .preprocess(toText, z.enum(values as [TValue, ...TValue[]]).optional())
    .catch(undefined);
}

function multiSelect<const TValue extends string = string>(
  values?: readonly TValue[],
) {
  return z
    .preprocess(
      (value) => toTextList(value, values),
      z.array(z.custom<TValue>((item) => typeof item === "string")).optional(),
    )
    .catch(undefined);
}

function boolean() {
  return z
    .preprocess((value) => {
      if (value === "true") return true;
      if (value === "false") return false;

      return value;
    }, z.boolean().optional())
    .catch(undefined);
}

function dateRange() {
  return z
    .preprocess(
      toText,
      z
        .string()
        .refine((value) => parseDateRange(value) !== null)
        .optional(),
    )
    .catch(undefined);
}

export const listFilter = {
  text,
  select,
  multiSelect,
  boolean,
  dateRange,
};

export function createListQuerySchema<
  const TSortField extends string,
  TFilters extends z.ZodRawShape = Record<never, z.ZodType>,
>({
  sortFields,
  filters,
  defaultPageSize = DEFAULT_PAGE_SIZE,
}: {
  sortFields: readonly [TSortField, ...TSortField[]];
  filters?: TFilters;
  defaultPageSize?: number;
}) {
  return z
    .object({
      page: z.number().int().min(1).default(1).catch(1),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(MAX_PAGE_SIZE)
        .default(defaultPageSize)
        .catch(defaultPageSize),
      sort: z
        .templateLiteral([z.enum(sortFields), ".", z.enum(SORT_DIRECTIONS)])
        .optional()
        .catch(undefined),
      search: text(),
    })
    .extend((filters ?? {}) as TFilters);
}
