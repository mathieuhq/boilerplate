import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  ListUsersInput,
  ListUsersOutput,
} from "../dto/admin-user-list.dto";

export class ListUsersUseCase implements IUseCase<
  ListUsersInput,
  ListUsersOutput
> {
  constructor(private readonly authProvider: IAuthProviderPort) {}

  async execute(input: ListUsersInput): Promise<Result<ListUsersOutput>> {
    const result = await this.authProvider.listUsers({
      sortBy: input.sortBy,
      searchValue: input.searchValue,
      searchField: input.searchField,
      offset: input.offset,
      sortDirection: input.sortDirection,
      limit: input.limit,
    });

    return Result.ok({
      users: result.users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      })),
      total: result.total,
    });
  }
}
