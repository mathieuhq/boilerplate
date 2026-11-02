import type { PaginatedResult } from "@/shared/domain/list-query";

import type {
  AdminOrganizationDetails,
  AdminOrganizationListItem,
} from "../../domain/repositories/admin.repository.interface";

export type AdminOrganizationListItemDTO = AdminOrganizationListItem;

export type AdminOrganizationDetailsDTO = AdminOrganizationDetails;

export type AdminOrganizationListDTO =
  PaginatedResult<AdminOrganizationListItemDTO>;
