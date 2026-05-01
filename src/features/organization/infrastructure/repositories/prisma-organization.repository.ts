import type { PrismaClient } from "@/lib/generated/prisma/client";

import type { Organization } from "../../domain/entities/organization.entity";
import type { IOrganizationRepository } from "../../domain/repositories/organization.repository.interface";
import { toDomain } from "../mappers/prisma-organization.mapper";

export class PrismaOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManageableByUser(
    userId: string,
    activeOrganizationId?: string | null,
  ): Promise<Organization | null> {
    if (activeOrganizationId) {
      const member = await this.prisma.member.findFirst({
        where: {
          organizationId: activeOrganizationId,
          userId,
          role: { in: ["owner", "admin"] },
        },
        include: {
          organization: true,
        },
      });

      if (!member) return null;

      return toDomain(member.organization);
    }

    const member = await this.prisma.member.findFirst({
      where: {
        userId,
        role: { in: ["owner", "admin"] },
      },
      include: {
        organization: true,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    if (!member) return null;

    return toDomain(member.organization);
  }
}
