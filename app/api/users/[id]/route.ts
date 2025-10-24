import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { authRoute } from "@/lib/zod-route";
import { userIdSchema } from "@/schemas/user/user.schema";
import { userService } from "@/services/user/user.service";

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
    const user = await userService.getUserById(params.id);

    if (!user) {
      throw new ZodRouteError("User not found", 404);
    }

    return { user };
  });
