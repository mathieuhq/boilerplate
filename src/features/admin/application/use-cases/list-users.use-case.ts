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
      limit: input.limit,
      offset: input.offset,
      sortBy: input.sortBy,
      searchValue: input.searchValue,
      searchField: input.searchField,
      sortDirection: input.sortDirection,
    });

    return Result.ok({
      users: result.users.map((user) => ({
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        image: user.image,
      })),
      total: result.total,
    });
  }
}
