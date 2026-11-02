import { beforeEach, describe, expect, it, vi } from "vitest";

import { getFullAccess } from "@/shared/domain/access-control";

import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import { ResolveAccessUseCase } from "../use-cases/resolve-access.use-case";

import {
  createCustomRole,
  createMockAdminRoleRepository,
} from "./admin-role-repository.mock";

describe("ResolveAccessUseCase", () => {
  let useCase: ResolveAccessUseCase;
  let mockRoleRepository: IAdminRoleRepository;

  beforeEach(() => {
    mockRoleRepository = createMockAdminRoleRepository();
    useCase = new ResolveAccessUseCase(mockRoleRepository);
  });

  it("should grant full access to admins", async () => {
    const result = await useCase.execute({ role: "admin" });

    expect(result.value.access).toEqual(getFullAccess());
    expect(mockRoleRepository.findRoleByKey).not.toHaveBeenCalled();
  });

  it("should grant no access to users while the user role is unchanged", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(null);

    const result = await useCase.execute({ role: null });

    expect(mockRoleRepository.findRoleByKey).toHaveBeenCalledWith("user");
    expect(result.value.access).toEqual({});
  });

  it("should read the edited user role access", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(
      createCustomRole({
        key: "user",
        name: "User",
        access: { users: "read" },
      }),
    );

    const result = await useCase.execute({ role: "user" });

    expect(result.value.access).toEqual({ users: "read" });
  });

  it("should read custom role access", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(
      createCustomRole(),
    );

    const result = await useCase.execute({ role: "support" });

    expect(mockRoleRepository.findRoleByKey).toHaveBeenCalledWith("support");
    expect(result.value.access).toEqual({ users: "write" });
  });

  it("should grant no access for a deleted role", async () => {
    vi.mocked(mockRoleRepository.findRoleByKey).mockResolvedValue(null);

    const result = await useCase.execute({ role: "ghost" });

    expect(result.value.access).toEqual({});
  });
});
