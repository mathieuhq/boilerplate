import { ApplicationError } from "@/lib/errors/application-error";

/**
 * Error thrown by API routes with HTTP status code
 */
export class ZodRouteError extends ApplicationError {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status ?? 400;
  }
}
