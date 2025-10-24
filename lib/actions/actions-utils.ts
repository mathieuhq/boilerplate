/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  flattenValidationErrors,
  type SafeActionResult,
  type ValidationErrors,
} from "next-safe-action";
import type { z } from "zod";

/**
 * Checks if a server action succeeded
 */
export const isActionSuccessful = <T extends z.ZodType, Data>(
  action?: SafeActionResult<string, T, any, Data>,
): action is {
  data: Data;
  serverError: undefined;
  validationErrors: undefined;
} => {
  if (!action || action.serverError || action.validationErrors) return false;

  return true;
};

/**
 * Converts validation errors to a readable string
 */
export const validationErrorToString = (
  validationError: ValidationErrors<any>,
) => {
  const flatten = flattenValidationErrors(validationError);

  return Object.entries(flatten.fieldErrors)
    .map(
      ([key, value]) =>
        `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
    )
    .join("\n");
};
