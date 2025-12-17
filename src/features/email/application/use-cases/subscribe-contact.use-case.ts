import { logger } from "@/lib/logger";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { IEmailProviderPort } from "../ports/email-provider.port";

type SubscribeContactInput = {
  email: string;
  name?: string;
};

type SubscribeContactOutput = {
  success: boolean;
  contactId?: string;
};

export class SubscribeContactUseCase implements IUseCase<
  SubscribeContactInput,
  SubscribeContactOutput
> {
  constructor(private readonly emailProvider: IEmailProviderPort) {}

  async execute(
    input: SubscribeContactInput,
  ): Promise<Result<SubscribeContactOutput>> {
    if (!this.emailProvider.subscribeContact) {
      logger.warn(
        "[SubscribeContactUseCase] Provider does not support subscribeContact",
      );
      return Result.ok({ success: false });
    }

    const contactId = await this.emailProvider.subscribeContact({
      email: input.email,
      name: input.name,
    });

    if (!contactId) {
      logger.error("[SubscribeContactUseCase] Failed to subscribe", {
        email: input.email,
      });
      return Result.ok({ success: false });
    }

    return Result.ok({
      success: true,
      contactId,
    });
  }
}
