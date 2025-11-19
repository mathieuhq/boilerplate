import { storageController } from "@/controllers/storage.controller";
import { authRoute } from "@/lib/zod-route";
import { downloadFileQuerySchema } from "@/schemas/storage/storage.schema";

/**
 * GET /api/storage/download
 * Download a file from user's storage
 *
 * @query key - The file key (e.g., "users/123/avatar.png")
 *
 * @returns File stream with appropriate headers
 */
export const GET = authRoute
  .query(downloadFileQuerySchema)
  .handler(async (_req, { query, ctx }) => {
    const result = await storageController.downloadFile(ctx.user.id, query.key);

    if (!result.body)
      return new Response("File has no content", { status: 404 });

    const headers = new Headers();

    if (result.metadata.contentType)
      headers.set("Content-Type", result.metadata.contentType);

    headers.set("Content-Length", result.metadata.size.toString());

    const filename = query.key.split("/").pop() ?? "download";

    headers.set("Content-Disposition", `attachment; filename="${filename}"`);

    return new Response(result.body as unknown as BodyInit, {
      headers,
      status: 200,
    });
  });
