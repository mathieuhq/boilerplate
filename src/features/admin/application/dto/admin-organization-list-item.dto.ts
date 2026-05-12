import type {
  AdminListResult,
  AdminOrganizationDetails,
  AdminOrganizationListItem,
} from "../../domain/repositories/admin.repository.interface";

export type AdminOrganizationListItemDTO = AdminOrganizationListItem;

export type AdminOrganizationDetailsDTO = AdminOrganizationDetails;

export type AdminOrganizationListDTO =
  AdminListResult<AdminOrganizationListItemDTO>;
