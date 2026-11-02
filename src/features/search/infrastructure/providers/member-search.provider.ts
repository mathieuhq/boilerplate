import type { PrismaClient } from "@/lib/generated/prisma/client";

import type { ISearchProvider } from "../../domain/search-provider.interface";
import type {
  SearchContext,
  SearchProviderQuery,
  SearchRequirement,
  SearchResult,
} from "../../domain/search.types";

import { toContainsPattern, toPrefixPattern } from "./search-pattern";

type MemberSearchRow = {
  id: string;
  name: string;
  email: string;
};

const ORGANIZATION_MANAGER_ROLES = ["owner", "admin"] as const;

export class MemberSearchProvider implements ISearchProvider {
  readonly type = "members";
  readonly requirement: SearchRequirement = {
    kind: "organization",
    roles: ORGANIZATION_MANAGER_ROLES,
  };

  constructor(private readonly prisma: PrismaClient) {}

  async search(
    { term, limit }: SearchProviderQuery,
    context: SearchContext,
  ): Promise<SearchResult[]> {
    if (!context.membership) return [];

    const contains = toContainsPattern(term);
    const prefix = toPrefixPattern(term);

    const rows = await this.prisma.$queryRaw<MemberSearchRow[]>`
      SELECT "member"."id", "user"."name", "user"."email"
      FROM "member"
      INNER JOIN "user" ON "user"."id" = "member"."user_id"
      WHERE "member"."organization_id" = ${context.membership.organizationId}
        AND "user"."deleted_at" IS NULL
        AND (
          public.search_normalize("user"."name") LIKE public.search_normalize(${contains})
          OR public.search_normalize("user"."email") LIKE public.search_normalize(${contains})
        )
      ORDER BY
        (public.search_normalize("user"."name") LIKE public.search_normalize(${prefix})
          OR public.search_normalize("user"."email") LIKE public.search_normalize(${prefix})) DESC,
        "user"."name" ASC
      LIMIT ${limit}
    `;

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
