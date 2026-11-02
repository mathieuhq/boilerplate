import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import {
  toUserSessionDTO,
  type UserSessionDTO,
  type UserSessionListDTO,
} from "../dto/user-session.dto";
import { SessionOperationError } from "../errors/session-operation.error";
import type { IAuthProviderPort } from "../ports/auth-provider.port";
import type { ISessionManagementPort } from "../ports/session-management.port";
import { toSessionEntity } from "../services/to-session-entity";

type ListUserSessionsInput = Record<string, never>;

export class ListUserSessionsUseCase implements IUseCase<
  ListUserSessionsInput,
  UserSessionListDTO
> {
  constructor(
    private readonly authProvider: IAuthProviderPort,
    private readonly sessionManagement: ISessionManagementPort,
  ) {}

  async execute(
    _input: ListUserSessionsInput,
  ): Promise<Result<UserSessionListDTO>> {
    const current = await this.authProvider.getSession();

    if (!current)
      return Result.fail(
        new SessionOperationError(
          "SESSION_REQUIRED",
          "A session is required to list sessions",
        ),
      );

    const records = await this.sessionManagement.listSessions(current.user.id);
    const sessions = records
      .map(toSessionEntity)
      .filter(
        (session) =>
          !session.isExpired &&
          (!session.isImpersonation || session.id === current.session.id),
      )
      .map((session) => toUserSessionDTO(session, current.session.id))
      .sort(compareSessions);

    return Result.ok({
      sessions,
      canManage: !current.session.impersonatedBy,
    });
  }
}

function compareSessions(left: UserSessionDTO, right: UserSessionDTO) {
  if (left.isCurrent !== right.isCurrent) return left.isCurrent ? -1 : 1;

  return (right.lastActiveAt ?? "").localeCompare(left.lastActiveAt ?? "");
}
