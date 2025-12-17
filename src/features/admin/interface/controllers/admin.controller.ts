import type { ListUsersInput } from "../../application/dto/admin-user-list.dto";
import type { ListUsersUseCase } from "../../application/use-cases/list-users.use-case";
import type { PromoteToAdminUseCase } from "../../application/use-cases/promote-to-admin.use-case";
import type { RemoveUserUseCase } from "../../application/use-cases/remove-user.use-case";
import type { SetUserPasswordUseCase } from "../../application/use-cases/set-user-password.use-case";
import type { SetUserRoleUseCase } from "../../application/use-cases/set-user-role.use-case";

export class AdminController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly removeUserUseCase: RemoveUserUseCase,
    private readonly setUserRoleUseCase: SetUserRoleUseCase,
    private readonly promoteToAdminUseCase: PromoteToAdminUseCase,
    private readonly setUserPasswordUseCase: SetUserPasswordUseCase,
  ) {}

  async listUsers(input: ListUsersInput) {
    const result = await this.listUsersUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async removeUser(userId: string, adminUserId: string) {
    const result = await this.removeUserUseCase.execute({
      userId,
      adminUserId,
    });

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async setUserRole(
    userId: string,
    role: "user" | "admin",
    adminUserId: string,
  ) {
    const result = await this.setUserRoleUseCase.execute({
      userId,
      role,
      adminUserId,
    });

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async setUserPassword(userId: string, newPassword: string) {
    const result = await this.setUserPasswordUseCase.execute({
      userId,
      newPassword,
    });

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async promoteToAdminIfOriginal(userId: string, email: string) {
    const result = await this.promoteToAdminUseCase.execute({ userId, email });

    if (result.isFailure) throw result.error;

    return result.value.promoted;
  }
}
