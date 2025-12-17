import { listUsersSchema } from "@/features/admin/interface/schemas/admin.schema";
import { adminRoute } from "@/lib/zod-route";
import { container } from "@/shared/infrastructure/di/container";
import { ApiResponse } from "@/shared/infrastructure/http";

export const GET = adminRoute
  .query(listUsersSchema)
  .handler(async (_req, { query }) => {
    const adminController = container.getAdminController();
    const result = await adminController.listUsers(query);

    return ApiResponse.paginated(result.users, { total: result.total });
  });
