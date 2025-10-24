import { authRoute } from "@/lib/zod-route";
import { listUsersQuerySchema } from "@/schemas/user/user.schema";
import { userService } from "@/services/user/user.service";

/**
 * GET /api/users
 * List all users with pagination and search
 *
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10)
 * @query search - Search by name or email
 *
 * @returns List of users with pagination metadata
 */
export const GET = authRoute
  .query(listUsersQuerySchema)
  .handler(async (_req, { query }) => {
    const result = await userService.listUsers({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });

    return result;
  });
