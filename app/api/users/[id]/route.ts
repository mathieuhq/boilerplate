import { userController } from "@/controllers/user.controller";
import { authRoute } from "@/lib/zod-route";
import { userIdSchema } from "@/schemas/user/user.schema";

/**
 * GET /api/users/:id
 * Get a specific user by ID
 *
 * @params id - User ID
 * @returns User profile data
 */
export const GET = authRoute
  .params(userIdSchema)
  .handler(async (_req, { params }) => {
    const user = await userController.getUserById(params.id);

    return { user };
  });
