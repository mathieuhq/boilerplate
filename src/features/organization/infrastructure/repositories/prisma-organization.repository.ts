import type { PrismaClient } from "@/lib/generated/prisma/client";

import type { Organization } from "../../domain/entities/organization.entity";
import type { IOrganizationRepository } from "../../domain/repositories/organization.repository.interface";
import { toDomain } from "../mappers/prisma-organization.mapper";

export class PrismaOrganizationRepository implements IOrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserIdWithAdminRole(
    userId: string,
  ): Promise<Organization | null> {
    const member = await this.prisma.member.findFirst({
      where: {
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
}
