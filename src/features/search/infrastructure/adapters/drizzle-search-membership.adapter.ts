import { and, eq } from "drizzle-orm";

import type { Database } from "@/lib/db";
import { member } from "@/lib/schema";

import type {
  FindSearchMembershipInput,
  ISearchMembershipPort,
} from "../../application/ports/search-membership.port";
import type { SearchMembership } from "../../domain/search.types";

export class DrizzleSearchMembershipAdapter implements ISearchMembershipPort {
  constructor(private readonly db: Database) {}

  async findMembership({
    userId,
    organizationId,
  }: FindSearchMembershipInput): Promise<SearchMembership | null> {
    const membership = await this.db.query.member.findFirst({
      columns: { organizationId: true, role: true },
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.userId, userId),
      ),
    });

    return membership ?? null;
  }
}
