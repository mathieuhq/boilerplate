import type { PrismaClient } from "@/lib/generated/prisma/client";

import type {
  FindSearchMembershipInput,
  ISearchMembershipPort,
} from "../../application/ports/search-membership.port";
import type { SearchMembership } from "../../domain/search.types";

export class PrismaSearchMembershipAdapter implements ISearchMembershipPort {
  constructor(private readonly prisma: PrismaClient) {}

  async findMembership({
    userId,
    organizationId,
  }: FindSearchMembershipInput): Promise<SearchMembership | null> {
    const member = await this.prisma.member.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { organizationId: true, role: true },
    });

    return member;
  }
}
