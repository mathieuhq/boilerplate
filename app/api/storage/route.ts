import { storageController } from "@/controllers/storage.controller";
import { authRoute } from "@/lib/zod-route";
import { listFilesQuerySchema } from "@/schemas/storage/storage.schema";

/**
 * GET /api/storage
 * List files in user's storage with pagination
 *
 * @query prefix - Optional prefix to filter files
 * @query maxKeys - Maximum number of files to return (1-1000, default: 100)
 * @query continuationToken - Token for pagination
 *
 * @returns List of files with metadata and pagination info
 */
export const GET = authRoute
  .query(listFilesQuerySchema)
  .handler(async (_req, { query, ctx }) => {
    const result = await storageController.listFiles(ctx.user.id, query);

    return result;
  });
