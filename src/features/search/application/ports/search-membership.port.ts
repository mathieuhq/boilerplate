import type { SearchMembership } from "../../domain/search.types";

export type FindSearchMembershipInput = {
  userId: string;
  organizationId: string;
};

export type ISearchMembershipPort = {
  findMembership: (
    input: FindSearchMembershipInput,
  ) => Promise<SearchMembership | null>;
};
