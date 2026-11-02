import { ApplicationError } from "@/shared/domain/errors/application.error";

export class EmailDeliveryError extends ApplicationError {
  constructor(message = "Failed to send email") {
    super(message);
    this.name = "EmailDeliveryError";
  }
}
