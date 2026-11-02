import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import type { AccessGrants } from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import { resolveRoleAccess } from "../services/resolve-role-access";

type ResolveAccessInput = {
  role?: string | null;
};

type ResolveAccessOutput = {
  access: AccessGrants;
};

export class ResolveAccessUseCase implements IUseCase<
  ResolveAccessInput,
  ResolveAccessOutput
> {
  constructor(private readonly roleRepository: IAdminRoleRepository) {}

  async execute(
    input: ResolveAccessInput,
  ): Promise<Result<ResolveAccessOutput>> {
    const access = await resolveRoleAccess(this.roleRepository, input.role);

    return Result.ok({ access: access ?? {} });
  }
}
