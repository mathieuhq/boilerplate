import { userController } from "@/controllers/user.controller";
import { authRoute } from "@/lib/zod-route";
import { listUsersQuerySchema } from "@/schemas/user/user.schema";

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
    const result = await userController.listUsers(query);

    return result;
  });
