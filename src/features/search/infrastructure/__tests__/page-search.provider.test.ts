import { describe, expect, it } from "vitest";

import type { NavigationPage } from "@/lib/navigation";

import type { SearchContext } from "../../domain/search.types";
import { PageSearchProvider } from "../providers/page-search.provider";

const pages: NavigationPage[] = [
  { href: "/", titleKey: "dashboard", sectionKey: "general", icon: "page" },
  {
    href: "/settings/security",
    titleKey: "security",
    sectionKey: "settings",
    icon: "settings",
  },
  {
    href: "/settings/organization",
    titleKey: "organization",
    sectionKey: "settings",
    icon: "settings",
    organizationRoles: ["owner", "admin"],
  },
  {
    href: "/admin/users",
    titleKey: "users",
    sectionKey: "administrator",
    icon: "admin",
    feature: "users",
  },
  {
    href: "/admin/roles",
    titleKey: "roles",
    sectionKey: "administrator",
    icon: "admin",
    feature: "roles",
  },
];

const messages: Record<string, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    general: "General",
    security: "Security",
    settings: "Settings",
    organization: "Organization",
    users: "Users",
    roles: "Roles",
    administrator: "Administrator",
  },
  fr: {
    dashboard: "Tableau de bord",
    general: "Général",
    security: "Sécurité",
    settings: "Paramètres",
    organization: "Organisation",
    users: "Utilisateurs",
    roles: "Rôles",
    administrator: "Administrateur",
  },
};

const provider = new PageSearchProvider(
  pages,
  (locale, key) => messages[locale][key],
);

const context: SearchContext = {
  userId: "user-1",
  locale: "en",
  access: {},
  membership: null,
};

describe("PageSearchProvider", () => {
  it("is available to every authenticated user", () => {
    expect(provider.requirement).toEqual({ kind: "authenticated" });
  });

  it("matches translated titles and sections", async () => {
    const results = await provider.search(
      { term: "settings", limit: 5 },
      context,
    );

    expect(results).toEqual([
      {
        id: "/settings/security",
        type: "pages",
        title: "Security",
        subtitle: "Settings",
        icon: "settings",
        href: "/settings/security",
      },
    ]);
  });

  it("searches in the user locale without accents", async () => {
    const results = await provider.search(
      { term: "securite", limit: 5 },
      { ...context, locale: "fr" },
    );

    expect(results.map((result) => result.title)).toEqual(["Sécurité"]);
  });

  it("hides admin pages without the matching read access", async () => {
    const withoutAccess = await provider.search(
      { term: "admin", limit: 5 },
      context,
    );
    const withUsersAccess = await provider.search(
      { term: "admin", limit: 5 },
      { ...context, access: { users: "read" } },
    );

    expect(withoutAccess).toEqual([]);
    expect(withUsersAccess.map((result) => result.href)).toEqual([
      "/admin/users",
    ]);
  });

  it("shows organization settings to organization managers only", async () => {
    const member = await provider.search(
      { term: "organization", limit: 5 },
      { ...context, membership: { organizationId: "org-1", role: "member" } },
    );
    const owner = await provider.search(
      { term: "organization", limit: 5 },
      { ...context, membership: { organizationId: "org-1", role: "owner" } },
    );

    expect(member).toEqual([]);
    expect(owner.map((result) => result.href)).toEqual([
      "/settings/organization",
    ]);
  });

  it("applies the limit", async () => {
    const results = await provider.search(
      { term: "e", limit: 1 },
      { ...context, access: { users: "read", roles: "read" } },
    );

    expect(results).toHaveLength(1);
  });
});
