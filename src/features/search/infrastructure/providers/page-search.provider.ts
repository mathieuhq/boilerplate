import type { NavigationPage } from "@/lib/navigation";

import type { ISearchProvider } from "../../domain/search-provider.interface";
import { meetsSearchRequirement } from "../../domain/search-requirement";
import { matchesSearchTerm } from "../../domain/search-text";
import type {
  SearchContext,
  SearchProviderQuery,
  SearchRequirement,
  SearchResult,
} from "../../domain/search.types";

export type PageTranslator = (locale: string, key: string) => string;

function toPageRequirement(page: NavigationPage): SearchRequirement {
  if (page.feature)
    return { kind: "access", feature: page.feature, level: "read" };

  if (page.organizationRoles)
    return { kind: "organization", roles: page.organizationRoles };

  return { kind: "authenticated" };
}

export class PageSearchProvider implements ISearchProvider {
  readonly type = "pages";
  readonly requirement: SearchRequirement = { kind: "authenticated" };

  constructor(
    private readonly pages: readonly NavigationPage[],
    private readonly translate: PageTranslator,
  ) {}

  async search(
    { term, limit }: SearchProviderQuery,
    context: SearchContext,
  ): Promise<SearchResult[]> {
    return this.pages
      .filter((page) =>
        meetsSearchRequirement(toPageRequirement(page), context),
      )
      .map((page) => ({
        id: page.href,
        type: this.type,
        title: this.translate(context.locale, page.titleKey),
        subtitle: this.translate(context.locale, page.sectionKey),
        icon: page.icon,
        href: page.href,
      }))
      .filter((result) =>
        matchesSearchTerm([result.title, result.subtitle], term),
      )
      .slice(0, limit);
  }
}
