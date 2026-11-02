import { ApplicationError } from "@/shared/domain/errors/application.error";

export class SearchProviderTimeoutError extends ApplicationError {
  constructor(type: string, timeoutMs: number) {
    super(`Search provider "${type}" timed out after ${timeoutMs}ms`);
    this.name = "SearchProviderTimeoutError";
  }
}
