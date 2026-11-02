import type { PrismaClient } from "@/lib/generated/prisma/client";

import type { ISearchProvider } from "../../domain/search-provider.interface";
import type {
  SearchProviderQuery,
  SearchRequirement,
  SearchResult,
} from "../../domain/search.types";

import { toContainsPattern, toPrefixPattern } from "./search-pattern";

type UserSearchRow = {
  id: string;
  name: string;
  email: string;
};

export class UserSearchProvider implements ISearchProvider {
  readonly type = "users";
  readonly requirement: SearchRequirement = {
    kind: "access",
    feature: "users",
    level: "read",
  };

  constructor(private readonly prisma: PrismaClient) {}

  async search({ term, limit }: SearchProviderQuery): Promise<SearchResult[]> {
    const contains = toContainsPattern(term);
    const prefix = toPrefixPattern(term);

    const rows = await this.prisma.$queryRaw<UserSearchRow[]>`
      SELECT "id", "name", "email"
      FROM "user"
      WHERE "deleted_at" IS NULL
        AND (
          public.search_normalize("name") LIKE public.search_normalize(${contains})
          OR public.search_normalize("email") LIKE public.search_normalize(${contains})
        )
      ORDER BY
        (public.search_normalize("name") LIKE public.search_normalize(${prefix})
          OR public.search_normalize("email") LIKE public.search_normalize(${prefix})) DESC,
        "name" ASC
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      id: row.id,
      type: this.type,
      title: row.name,
      subtitle: row.email,
      icon: "user",
      href: `/admin/users?search=${encodeURIComponent(row.email)}`,
    }));
  }
}
