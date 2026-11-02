import { isNotFound, isRedirect } from "@tanstack/react-router";

import { logger } from "@/lib/logger";

const PROPAGATED_ERROR_CODES = new Set(["UNAUTHORIZED", "FORBIDDEN"]);

export async function loadListData<T>(load: () => Promise<T>) {
  try {
    return await load();
  } catch (error) {
    if (isRedirect(error) || isNotFound(error) || isPropagatedError(error))
      throw error;

    logger.error("List data failed to load", error);

    return null;
  }
}

function isPropagatedError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    PROPAGATED_ERROR_CODES.has(error.code)
  );
}
