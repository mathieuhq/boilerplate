import type { ListUserSessionsUseCase } from "../../application/use-cases/list-user-sessions.use-case";
import type { RevokeOtherUserSessionsUseCase } from "../../application/use-cases/revoke-other-user-sessions.use-case";
import type { RevokeUserSessionUseCase } from "../../application/use-cases/revoke-user-session.use-case";

export class SessionController {
  constructor(
    private readonly listUserSessionsUseCase: ListUserSessionsUseCase,
    private readonly revokeUserSessionUseCase: RevokeUserSessionUseCase,
    private readonly revokeOtherUserSessionsUseCase: RevokeOtherUserSessionsUseCase,
  ) {}

  async listSessions() {
    const result = await this.listUserSessionsUseCase.execute({});

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async revokeSession(input: { sessionId: string }) {
    const result = await this.revokeUserSessionUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async revokeOtherSessions() {
    const result = await this.revokeOtherUserSessionsUseCase.execute({});

    if (result.isFailure) throw result.error;

    return result.value;
  }
}
