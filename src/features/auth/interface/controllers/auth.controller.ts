import type { GetCurrentUserUseCase } from "../../application/use-cases/get-current-user.use-case";
import type { GetSessionUseCase } from "../../application/use-cases/get-session.use-case";
import type { PurgeExpiredAuthRecordsUseCase } from "../../application/use-cases/purge-expired-auth-records.use-case";

export class AuthController {
  constructor(
    private readonly getSessionUseCase: GetSessionUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly purgeExpiredAuthRecordsUseCase: PurgeExpiredAuthRecordsUseCase,
  ) {}

  async getSession() {
    const result = await this.getSessionUseCase.execute({});

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async getCurrentUser() {
    const result = await this.getCurrentUserUseCase.execute({});

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async purgeExpiredRecords() {
    const result = await this.purgeExpiredAuthRecordsUseCase.execute({});

    if (result.isFailure) throw result.error;

    return result.value;
  }
}
