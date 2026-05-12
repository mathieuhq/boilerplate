import type {
  AdminListResult,
  AdminUserListItem,
} from "../../domain/repositories/admin.repository.interface";

export type AdminUserListItemDTO = AdminUserListItem;

export type AdminUserListDTO = AdminListResult<AdminUserListItemDTO>;
