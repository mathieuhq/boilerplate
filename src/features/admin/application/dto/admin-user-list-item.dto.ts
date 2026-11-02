import type { PaginatedResult } from "@/shared/domain/list-query";

import type { AdminUserListItem } from "../../domain/repositories/admin.repository.interface";

export type AdminUserListItemDTO = AdminUserListItem;

export type AdminUserListDTO = PaginatedResult<AdminUserListItemDTO>;
