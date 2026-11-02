import { z } from "zod";

import {
  SEARCH_TERM_MAX_LENGTH,
  SEARCH_TERM_MIN_LENGTH,
} from "../../domain/value-objects/search-term.value-object";

export const globalSearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(SEARCH_TERM_MIN_LENGTH)
    .max(SEARCH_TERM_MAX_LENGTH),
});
