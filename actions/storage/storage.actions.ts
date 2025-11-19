"use server";

import { storageController } from "@/controllers/storage.controller";
import { authAction } from "@/lib/actions/safe-actions";
import {
  bulkDeleteFilesSchema,
  deleteFileSchema,
  getSignedUrlSchema,
  uploadFileSchema,
} from "@/schemas/storage/storage.schema";

/**
 * Server action to upload a file
 * File is automatically scoped to users/{userId}/
 */
export const uploadFileAction = authAction
  .inputSchema(uploadFileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await storageController.uploadFile(ctx.user.id, parsedInput);

    return {
      success: true,
      file: result,
    };
  });

/**
 * Server action to delete a file
 * Validates that the file belongs to the authenticated user
 */
export const deleteFileAction = authAction
  .inputSchema(deleteFileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await storageController.deleteFile(ctx.user.id, parsedInput);

    return result;
  });

/**
 * Server action to delete multiple files
 * Validates that all files belong to the authenticated user
 */
export const deleteFilesAction = authAction
  .inputSchema(bulkDeleteFilesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await storageController.deleteFiles(
      ctx.user.id,
      parsedInput,
    );

    return {
      success: true,
      ...result,
    };
  });

/**
 * Server action to generate a signed URL
 * Validates that the file belongs to the authenticated user
 */
export const getSignedUrlAction = authAction
  .inputSchema(getSignedUrlSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await storageController.getSignedUrl(
      ctx.user.id,
      parsedInput,
    );

    return {
      success: true,
      ...result,
    };
  });
