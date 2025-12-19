/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  flattenValidationErrors,
  type SafeActionResult,
  type ValidationErrors,
} from "next-safe-action";
import type { z } from "zod";

import type { ActionErrorResponse } from "@/shared/infrastructure/http";

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

const validationErrorToString = (validationError: ValidationErrors<any>) => {
  const flatten = flattenValidationErrors(validationError);
  return Object.entries(flatten.fieldErrors)
    .map(
      ([key, value]) =>
        `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
    )
    .join("\n");
};

function parseServerError(serverError: string): ActionErrorResponse["error"] {
  try {
    const parsed = JSON.parse(serverError) as ActionErrorResponse;
    return parsed.error;
  } catch {
    return {
      code: "UNKNOWN_ERROR",
      message: serverError,
    };
  }
}

export function getActionErrorMessage(
  action: SafeActionResult<string, any, any, any>,
): string {
  if (action.validationErrors)
    return validationErrorToString(action.validationErrors);

  if (action.serverError) {
    const parsed = parseServerError(action.serverError);
    return parsed.message;
  }

  return "An unexpected error occurred";
}
