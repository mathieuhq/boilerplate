import { asc, desc, sql } from "drizzle-orm";

import type { Database } from "@/lib/db";
import { organization } from "@/lib/schema";

import type { ISearchProvider } from "../../domain/search-provider.interface";
import type {
  SearchProviderQuery,
  SearchRequirement,
  SearchResult,
} from "../../domain/search.types";

import { toContainsPattern, toPrefixPattern } from "./search-pattern";

export class OrganizationSearchProvider implements ISearchProvider {
  readonly type = "organizations";
  readonly requirement: SearchRequirement = {
    kind: "access",
    feature: "organizations",
    level: "read",
  };

  constructor(private readonly db: Database) {}

  async search({ term, limit }: SearchProviderQuery): Promise<SearchResult[]> {
    const contains = toContainsPattern(term);
    const prefix = toPrefixPattern(term);

    const rows = await this.db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      })
      .from(organization)
      .where(
        sql`(public.search_normalize(${organization.name}) LIKE public.search_normalize(${contains})
          OR public.search_normalize(${organization.slug}) LIKE public.search_normalize(${contains}))`,
      )
      .orderBy(
        desc(
          sql`(public.search_normalize(${organization.name}) LIKE public.search_normalize(${prefix})
            OR public.search_normalize(${organization.slug}) LIKE public.search_normalize(${prefix}))`,
        ),
        asc(organization.name),
      )
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      type: this.type,
      title: row.name,
      subtitle: row.slug,
      icon: "organization",
      href: `/admin/organizations?search=${encodeURIComponent(row.slug)}`,
    }));
  }
}
