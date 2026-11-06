import { and, asc, desc, isNull, sql } from "drizzle-orm";

import type { Database } from "@/lib/db";
import { user } from "@/lib/schema";

import type { ISearchProvider } from "../../domain/search-provider.interface";
import type {
  SearchProviderQuery,
  SearchRequirement,
  SearchResult,
} from "../../domain/search.types";

import { toContainsPattern, toPrefixPattern } from "./search-pattern";

export class UserSearchProvider implements ISearchProvider {
  readonly type = "users";
  readonly requirement: SearchRequirement = {
    kind: "access",
    feature: "users",
    level: "read",
  };

  constructor(private readonly db: Database) {}

  async search({ term, limit }: SearchProviderQuery): Promise<SearchResult[]> {
    const contains = toContainsPattern(term);
    const prefix = toPrefixPattern(term);

    const rows = await this.db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(
        and(
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
      icon: "user",
      href: `/admin/users?search=${encodeURIComponent(row.email)}`,
    }));
  }
}
