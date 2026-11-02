import type {
  AccessFeature,
  AccessGrants,
  AccessLevel,
} from "@/shared/domain/access-control";

export type SearchResultIcon =
  | "page"
  | "settings"
  | "admin"
  | "user"
  | "organization"
  | "member";

export type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  icon: SearchResultIcon;
  href: string;
};

export type SearchMembership = {
  organizationId: string;
  role: string;
};

export type SearchRequirement =
  | { kind: "authenticated" }
  | { kind: "access"; feature: AccessFeature; level: AccessLevel }
  | { kind: "organization"; roles?: readonly string[] };

export type SearchContext = {
  userId: string;
  locale: string;
  access: AccessGrants;
  membership: SearchMembership | null;
};

export type SearchProviderQuery = {
  term: string;
  limit: number;
};
