import { DomainError } from "@/shared/domain/errors/domain.error";

export class DuplicateSearchProviderError extends DomainError {
  constructor(type: string) {
    super(`A search provider is already registered for "${type}"`);
    this.name = "DuplicateSearchProviderError";
  }
}
