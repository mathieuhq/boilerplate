import { DomainError } from "@/shared/domain/errors/domain.error";

export class InvalidNotificationLinkError extends DomainError {
  constructor(link: string) {
    super(`Notification links must be relative app paths, received "${link}"`);
    this.name = "InvalidNotificationLinkError";
  }
}
