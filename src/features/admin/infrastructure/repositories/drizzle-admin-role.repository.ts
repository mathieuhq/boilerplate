import { asc, count, eq, isNull } from "drizzle-orm";

import type { Database } from "@/lib/db";
import { role, user } from "@/lib/schema";
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

type DrizzleRole = typeof role.$inferSelect;

export class DrizzleAdminRoleRepository implements IAdminRoleRepository {
  constructor(private readonly db: Database) {}

  async listRoles(): Promise<AdminCustomRole[]> {
    const roles = await this.db.query.role.findMany({
      orderBy: [asc(role.name), asc(role.key)],
    });

    return roles.map(toAdminCustomRole);
  }

  async findRoleByKey(key: string): Promise<AdminCustomRole | null> {
    const found = await this.db.query.role.findFirst({
      where: eq(role.key, key),
    });

    return found ? toAdminCustomRole(found) : null;
  }

  async createRole(input: AdminSaveRoleInput): Promise<AdminCustomRole> {
    const [created] = await this.db
      .insert(role)
      .values(toDrizzleRole(input))
      .returning();

    return toAdminCustomRole(created);
  }

  async updateRole(input: AdminSaveRoleInput): Promise<AdminCustomRole> {
    const [saved] = await this.db
      .insert(role)
      .values(toDrizzleRole(input))
      .onConflictDoUpdate({
        target: role.key,
        set: {
          name: input.name,
          description: input.description,
          permissions: toAccessEntries(input.access),
        },
      })
      .returning();

    return toAdminCustomRole(saved);
  }

  async deleteRole(key: string): Promise<void> {
    const deleted = await this.db
      .delete(role)
      .where(eq(role.key, key))
      .returning({ id: role.id });

    if (deleted.length === 0) throw new Error("Record to delete not found");
  }

  async countUsersByRole(): Promise<Record<string, number>> {
    const groups = await this.db
      .select({ role: user.role, count: count() })
      .from(user)
      .where(isNull(user.deletedAt))
      .groupBy(user.role);

    const counts: Record<string, number> = {};

    for (const group of groups) {
      const key = normalizeRoleKey(group.role);
      counts[key] = (counts[key] ?? 0) + group.count;
    }

    return counts;
  }
}

function toAdminCustomRole(row: DrizzleRole): AdminCustomRole {
  return {
    key: row.key,
    name: row.name,
    description: row.description,
    access: fromAccessEntries(row.permissions),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDrizzleRole(input: AdminSaveRoleInput) {
  return {
    key: input.key,
    name: input.name,
    description: input.description,
    permissions: toAccessEntries(input.access),
  };
}
