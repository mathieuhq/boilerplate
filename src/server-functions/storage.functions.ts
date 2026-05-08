import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import type {
  DeleteFileOutputDTO,
  GenerateDownloadUrlOutputDTO,
  GenerateUploadUrlOutputDTO,
  ProcessAndUploadFileOutputDTO,
} from "@/features/storage/application/dto/presigned-url.dto";
import {
  deleteFileSchema,
  generateDownloadUrlSchema,
  generateUploadUrlSchema,
  processAndUploadFileSchema,
} from "@/features/storage/interface/schemas/storage.schema";
import { getRequiredActionUser } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { container } from "@/shared/infrastructure/di/container";
import {
  ActionResponse,
  type ActionResponse as ActionResponseType,
} from "@/shared/infrastructure/http/api-response";

import { actionErrorResponse } from "./action-errors.server";

type GenerateUploadUrlInput = z.infer<typeof generateUploadUrlSchema>;
type GenerateDownloadUrlInput = z.infer<typeof generateDownloadUrlSchema>;
type DeleteFileInput = z.infer<typeof deleteFileSchema>;
type ProcessAndUploadFileInput = z.infer<typeof processAndUploadFileSchema>;

const generateUploadUrlServerFn = createServerFn({ method: "POST" })
  .inputValidator(generateUploadUrlSchema)
  .handler(async ({ data }) => {
    try {
      await getRequiredActionUser();
      const storageController = container.getStorageController();
      const result = await storageController.generateUploadUrl(data);

      return ActionResponse.success(result);
    } catch (error) {
      return actionErrorResponse(error);
    }
  });

const generateDownloadUrlServerFn = createServerFn({ method: "POST" })
  .inputValidator(generateDownloadUrlSchema)
  .handler(async ({ data }) => {
    try {
      await getRequiredActionUser();
      const storageController = container.getStorageController();
      const result = await storageController.generateDownloadUrl(data.key);

      return ActionResponse.success(result);
    } catch (error) {
      return actionErrorResponse(error);
    }
  });

const deleteFileServerFn = createServerFn({ method: "POST" })
  .inputValidator(deleteFileSchema)
  .handler(async ({ data }) => {
    try {
      await getRequiredActionUser();
      const storageController = container.getStorageController();
      const result = await storageController.deleteFile(data.key);

      return ActionResponse.success(result);
    } catch (error) {
      return actionErrorResponse(error);
    }
  });

const processAndUploadFileServerFn = createServerFn({ method: "POST" })
  .inputValidator((data) => {
    if (!(data instanceof FormData)) {
      throw ActionError.validationError("Expected FormData");
    }

    const file = data.get("file");

    if (!(file instanceof File)) {
      throw ActionError.validationError("A file is required");
    }

    const parsedInput = processAndUploadFileSchema.parse({
      prefix: data.get("prefix")?.toString(),
      contentType: data.get("contentType")?.toString(),
    });

    return {
      file,
      ...parsedInput,
    };
  })
  .handler(async ({ data }) => {
    try {
      await getRequiredActionUser();
      const storageController = container.getStorageController();
      const arrayBuffer = await data.file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await storageController.processAndUploadFile({
        buffer,
        prefix: data.prefix,
        contentType: data.contentType,
      });

      return ActionResponse.success(result);
    } catch (error) {
      return actionErrorResponse(error);
    }
  });

export async function generateUploadUrlAction(data: GenerateUploadUrlInput) {
  return generateUploadUrlServerFn({ data }) as Promise<
    ActionResponseType<GenerateUploadUrlOutputDTO>
  >;
}

export async function generateDownloadUrlAction(
  data: GenerateDownloadUrlInput,
) {
  return generateDownloadUrlServerFn({ data }) as Promise<
    ActionResponseType<GenerateDownloadUrlOutputDTO>
  >;
}

export async function deleteFileAction(data: DeleteFileInput) {
  return deleteFileServerFn({ data }) as Promise<
    ActionResponseType<DeleteFileOutputDTO>
  >;
}

export async function processAndUploadFileAction(
  file: File,
  data: ProcessAndUploadFileInput,
) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("contentType", data.contentType);

  if (data.prefix) formData.set("prefix", data.prefix);

  return processAndUploadFileServerFn({ data: formData }) as Promise<
    ActionResponseType<ProcessAndUploadFileOutputDTO>
  >;
}
