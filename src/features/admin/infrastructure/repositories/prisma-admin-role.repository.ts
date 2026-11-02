import type { PrismaClient } from "@/lib/generated/prisma/client";
import {
  fromAccessEntries,
  toAccessEntries,
} from "@/shared/domain/access-control";

import type {
  AdminCustomRole,
  AdminSaveRoleInput,
  IAdminRoleRepository,
} from "../../domain/repositories/admin-role.repository.interface";
import { normalizeRoleKey } from "../../domain/roles";

type PrismaRole = {
  key: string;
  name: string;
  description: string | null;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaAdminRoleRepository implements IAdminRoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listRoles(): Promise<AdminCustomRole[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: [{ name: "asc" }, { key: "asc" }],
    });

    return roles.map(toAdminCustomRole);
  }

  async findRoleByKey(key: string): Promise<AdminCustomRole | null> {
    const role = await this.prisma.role.findUnique({ where: { key } });

    return role ? toAdminCustomRole(role) : null;
  }

  async createRole(input: AdminSaveRoleInput): Promise<AdminCustomRole> {
    const role = await this.prisma.role.create({ data: toPrismaRole(input) });

    return toAdminCustomRole(role);
  }

  async updateRole(input: AdminSaveRoleInput): Promise<AdminCustomRole> {
    const role = await this.prisma.role.upsert({
      where: { key: input.key },
      create: toPrismaRole(input),
      update: {
        name: input.name,
        description: input.description,
        permissions: toAccessEntries(input.access),
      },
    });

    return toAdminCustomRole(role);
  }

  async deleteRole(key: string): Promise<void> {
    await this.prisma.role.delete({ where: { key } });
  }

  async countUsersByRole(): Promise<Record<string, number>> {
    const groups = await this.prisma.user.groupBy({
      by: ["role"],
      where: { deletedAt: null },
      _count: { _all: true },
    });

    const counts: Record<string, number> = {};

    for (const group of groups) {
      const key = normalizeRoleKey(group.role);
      counts[key] = (counts[key] ?? 0) + group._count._all;
    }

    return counts;
  }
}

function toAdminCustomRole(role: PrismaRole): AdminCustomRole {
  return {
    key: role.key,
    name: role.name,
    description: role.description,
    access: fromAccessEntries(role.permissions),
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

function toPrismaRole(input: AdminSaveRoleInput) {
  return {
    key: input.key,
    name: input.name,
    description: input.description,
    permissions: toAccessEntries(input.access),
  };
}
