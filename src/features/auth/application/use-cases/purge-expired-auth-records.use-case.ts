import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  IExpiredAuthRecordsPort,
  PurgedAuthRecords,
} from "../ports/expired-auth-records.port";

type PurgeExpiredAuthRecordsInput = Record<string, never>;

export class PurgeExpiredAuthRecordsUseCase implements IUseCase<
  PurgeExpiredAuthRecordsInput,
  PurgedAuthRecords
> {
  constructor(
    private readonly expiredAuthRecords: IExpiredAuthRecordsPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    _input: PurgeExpiredAuthRecordsInput,
  ): Promise<Result<PurgedAuthRecords>> {
    const purged = await this.expiredAuthRecords.purgeExpiredBefore(this.now());

    return Result.ok(purged);
  }
}
