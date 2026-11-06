import { and, asc, eq, inArray } from "drizzle-orm";

import type { Database } from "@/lib/db";
import { member } from "@/lib/schema";

import type { Organization } from "../../domain/entities/organization.entity";
import type { IOrganizationRepository } from "../../domain/repositories/organization.repository.interface";
import { toDomain } from "../mappers/drizzle-organization.mapper";

const MANAGER_ROLES = ["owner", "admin"];

export class DrizzleOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly db: Database) {}

  async findManageableByUser(
    userId: string,
    activeOrganizationId?: string | null,
  ): Promise<Organization | null> {
    const row = await this.db.query.member.findFirst({
      where: and(
        activeOrganizationId
          ? eq(member.organizationId, activeOrganizationId)
          : undefined,
        eq(member.userId, userId),
        inArray(member.role, MANAGER_ROLES),
      ),
      with: { organization: true },
      orderBy: [asc(member.createdAt), asc(member.id)],
    });

    return row ? toDomain(row.organization) : null;
  }
}
