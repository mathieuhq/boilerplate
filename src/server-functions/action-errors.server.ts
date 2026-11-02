import { ActionResponse } from "@/shared/infrastructure/http/api-response";
import { classifyError } from "@/shared/infrastructure/http/error-classifier";

export function actionErrorResponse(error: unknown) {
  const { code, message, details } = classifyError(error);

  return ActionResponse.error(code, message, details);
}
