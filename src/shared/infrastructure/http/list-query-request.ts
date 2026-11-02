import { defaultParseSearch } from "@tanstack/react-router";
import type { z } from "zod";

export function parseListQueryRequest<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): z.output<TSchema> {
  const { search } = new URL(request.url);

  return schema.parse(defaultParseSearch(search));
}
