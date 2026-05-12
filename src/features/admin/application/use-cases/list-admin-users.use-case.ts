import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  AdminListUsersInput,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";
import type { AdminUserListDTO } from "../dto/admin-user-list-item.dto";

type ListAdminUsersOutput = {
  users: AdminUserListDTO;
};

export class ListAdminUsersUseCase implements IUseCase<
  AdminListUsersInput,
  ListAdminUsersOutput
> {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(
    input: AdminListUsersInput,
  ): Promise<Result<ListAdminUsersOutput>> {
    const users = await this.adminRepository.listUsers(input);

    return Result.ok({ users });
  }
}
