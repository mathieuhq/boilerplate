import { logger } from "@/lib/logger";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { IEmailProviderPort } from "../ports/email-provider.port";

type UnsubscribeContactInput = {
  contactId: string;
};

type UnsubscribeContactOutput = {
  success: boolean;
};

export class UnsubscribeContactUseCase implements IUseCase<
  UnsubscribeContactInput,
  UnsubscribeContactOutput
> {
  constructor(private readonly emailProvider: IEmailProviderPort) {}

  async execute(
    input: UnsubscribeContactInput,
  ): Promise<Result<UnsubscribeContactOutput>> {
    if (!this.emailProvider.unsubscribeContact) {
      logger.warn(
        "[UnsubscribeContactUseCase] Provider does not support unsubscribeContact",
      );
      return Result.ok({ success: false });
    }

    const result = await this.emailProvider.unsubscribeContact(input.contactId);

    if (!result) {
      logger.error("[UnsubscribeContactUseCase] Failed to unsubscribe", {
        contactId: input.contactId,
      });
      return Result.ok({ success: false });
    }

    return Result.ok({ success: true });
  }
}
