import type {
  ActionErrorResponse,
  ActionResponse,
} from "@/shared/infrastructure/http/api-response";
import { isActionSuccess } from "@/shared/infrastructure/http/api-response";

const isActionSuccessful = <Data>(
  action?: unknown,
): action is { data: Data } => {
  return Boolean(action && isActionSuccess(action as ActionResponse<Data>));
};

function getActionError(action?: unknown) {
  if (!action) return undefined;
  if (
    typeof action === "object" &&
    "error" in action &&
    action.error &&
    typeof action.error === "object" &&
    "message" in action.error
  )
    return action.error as ActionErrorResponse["error"];

  return undefined;
}

function getActionErrorMessage(action?: unknown): string {
  const error = getActionError(action);

  return error?.message ?? "An unexpected error occurred";
}

export function unwrapActionData<Data>(action?: ActionResponse<Data>): Data;

export function unwrapActionData(action?: unknown): unknown;

export function unwrapActionData<Data>(action?: unknown): Data {
  if (!isActionSuccessful(action))
    throw new Error(getActionErrorMessage(action));

  return (action as { data: Data }).data;
}
