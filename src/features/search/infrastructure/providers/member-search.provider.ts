import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import type { Database } from "@/lib/db";
import { member, user } from "@/lib/schema";

import type { ISearchProvider } from "../../domain/search-provider.interface";
import type {
  SearchContext,
  SearchProviderQuery,
  SearchRequirement,
  SearchResult,
} from "../../domain/search.types";

import { toContainsPattern, toPrefixPattern } from "./search-pattern";

const ORGANIZATION_MANAGER_ROLES = ["owner", "admin"] as const;

export class MemberSearchProvider implements ISearchProvider {
  readonly type = "members";
  readonly requirement: SearchRequirement = {
    kind: "organization",
    roles: ORGANIZATION_MANAGER_ROLES,
  };

  constructor(private readonly db: Database) {}

  async search(
    { term, limit }: SearchProviderQuery,
    context: SearchContext,
  ): Promise<SearchResult[]> {
    if (!context.membership) return [];

    const contains = toContainsPattern(term);
    const prefix = toPrefixPattern(term);

    const rows = await this.db
      .select({ id: member.id, name: user.name, email: user.email })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(
        and(
          eq(member.organizationId, context.membership.organizationId),
          isNull(user.deletedAt),
          sql`(public.search_normalize(${user.name}) LIKE public.search_normalize(${contains})
            OR public.search_normalize(${user.email}) LIKE public.search_normalize(${contains}))`,
        ),
      )
      .orderBy(
        desc(
          sql`(public.search_normalize(${user.name}) LIKE public.search_normalize(${prefix})
            OR public.search_normalize(${user.email}) LIKE public.search_normalize(${prefix}))`,
        ),
        asc(user.name),
      )
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      type: this.type,
      title: row.name,
      subtitle: row.email,
      icon: "member",
      href: "/settings/organization",
    }));
  }
}
