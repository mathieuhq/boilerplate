import type { AccessGrants } from "@/shared/domain/access-control";

import type { SearchResult } from "../../domain/search.types";

export type SearchGroupDTO = {
  type: string;
  results: SearchResult[];
};

export type SearchResponseDTO = {
  query: string;
  groups: SearchGroupDTO[];
  failedTypes: string[];
};

export type GlobalSearchInputDTO = {
  query: string;
  userId: string;
  locale: string;
  access: AccessGrants;
  activeOrganizationId: string | null;
};
