import { storageController } from "@/controllers/storage.controller";
import { authRoute } from "@/lib/zod-route";
import { fileExistsQuerySchema } from "@/schemas/storage/storage.schema";

/**
 * GET /api/storage/exists
 * Check if a file exists in user's storage
 *
 * @query key - The file key (e.g., "users/123/avatar.png")
 *
 * @returns JSON with exists boolean and key
 */
export const GET = authRoute
  .query(fileExistsQuerySchema)
  .handler(async (_req, { query, ctx }) => {
    const result = await storageController.fileExists(ctx.user.id, query.key);

    return result;
  });
