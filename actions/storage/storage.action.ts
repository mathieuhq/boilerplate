"use server";

import { z } from "zod";

import {
  deleteFileSchema,
  generateDownloadUrlSchema,
  generateUploadUrlSchema,
  processAndUploadFileSchema,
} from "@/features/storage/interface/schemas/storage.schema";
import { authAction } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import { ActionResponse } from "@/shared/infrastructure/http/api-response";

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

export const processAndUploadFileAction = authAction
  .inputSchema(processAndUploadFileSchema)
  .bindArgsSchemas<[z.ZodType<File>]>([z.instanceof(File)])
  .action(async ({ parsedInput, bindArgsParsedInputs: [file] }) => {
    const storageController = container.getStorageController();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await storageController.processAndUploadFile({
      buffer,
      contentType: parsedInput.contentType,
      prefix: parsedInput.prefix,
    });

    return ActionResponse.success(result);
  });
