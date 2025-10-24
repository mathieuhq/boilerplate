/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  flattenValidationErrors,
  type SafeActionResult,
  type ValidationErrors,
} from "next-safe-action";
import type { z } from "zod";

/**
 * Determines if a server action is successful or not
 * A server action is successful if it has a data property and no serverError property
 *
 * @param action Return value of a server action
 * @returns A boolean indicating if the action is successful
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
 * Converts validation errors to a string
 *
 * @param validationError Validation errors from a server action
 * @returns A string representation of the validation errors
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
