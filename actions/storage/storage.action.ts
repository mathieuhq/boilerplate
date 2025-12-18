"use server";

import {
  deleteFileSchema,
  generateDownloadUrlSchema,
  generateUploadUrlSchema,
} from "@/features/storage/interface/schemas/storage.schema";
import { authAction } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import { ActionResponse } from "@/shared/infrastructure/http";

export const generateUploadUrlAction = authAction
  .inputSchema(generateUploadUrlSchema)
  .action(async ({ parsedInput }) => {
    const storageController = container.getStorageController();
    const result = await storageController.generateUploadUrl(parsedInput);

    return ActionResponse.success(result);
  });

export const generateDownloadUrlAction = authAction
  .inputSchema(generateDownloadUrlSchema)
  .action(async ({ parsedInput }) => {
    const storageController = container.getStorageController();
    const result = await storageController.generateDownloadUrl(parsedInput.key);

    return ActionResponse.success(result);
  });

export const deleteFileAction = authAction
  .inputSchema(deleteFileSchema)
  .action(async ({ parsedInput }) => {
    const storageController = container.getStorageController();
    const result = await storageController.deleteFile(parsedInput.key);

    return ActionResponse.success(result);
  });
