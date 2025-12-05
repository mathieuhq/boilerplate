import { adminController } from "@/controllers/admin.controller";
import { adminRoute } from "@/lib/zod-route";
import { listUsersSchema } from "@/schemas/admin/admin.schema";

/**
 * GET /api/admin/users
 * List all users with pagination and search (admin only)
 *
 * @query searchValue - Search by name or email
 * @query searchField - Field to search in
 * @query limit - Items per page
 * @query offset - Pagination offset
 * @query sortBy - Field to sort by
 * @query sortDirection - Sort direction (asc/desc)
 *
 * @returns List of users with pagination metadata
 */
export const GET = adminRoute
  .query(listUsersSchema)
  .handler(async (_req, { query }) => {
    const result = await adminController.listUsers(query);

    return result;
  });
