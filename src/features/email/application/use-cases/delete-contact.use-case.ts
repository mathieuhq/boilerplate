import { logger } from "@/lib/logger";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { IEmailProviderPort } from "../ports/email-provider.port";

type DeleteContactInput = {
  contactId: string;
};

type DeleteContactOutput = {
  success: boolean;
};

export class DeleteContactUseCase implements IUseCase<
  DeleteContactInput,
  DeleteContactOutput
> {
  constructor(private readonly emailProvider: IEmailProviderPort) {}

  async execute(
    input: DeleteContactInput,
  ): Promise<Result<DeleteContactOutput>> {
    if (!this.emailProvider.deleteContact) {
      logger.warn(
        "[DeleteContactUseCase] Provider does not support deleteContact",
      );

      return Result.ok({ success: false });
    }

    const deleted = await this.emailProvider.deleteContact(input.contactId);

    if (!deleted) {
      logger.error("[DeleteContactUseCase] Failed to delete contact", {
        contactId: input.contactId,
      });

      return Result.ok({ success: false });
    }

    return Result.ok({ success: true });
  }
}
