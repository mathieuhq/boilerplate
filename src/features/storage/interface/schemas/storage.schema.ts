import { z } from "zod";

import { ContentType } from "../../domain/value-objects/content-type.value-object";

const allowedTypes = ContentType.getAllowedTypes();

export const generateUploadUrlSchema = z.object({
  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name too long"),
  contentType: z.enum(allowedTypes as [string, ...string[]], {
    error: `Invalid content type. Allowed types: ${allowedTypes.join(", ")}`,
  }),
  fileSize: z
    .number()
    .int()
    .positive("File size must be positive")
    .max(10 * 1024 * 1024, "File size cannot exceed 10 MB"),
  prefix: z.string().min(1).max(100).optional(),
});

export const generateDownloadUrlSchema = z.object({
  key: z.string().min(1, "File key is required").max(1024, "File key too long"),
});

export const deleteFileSchema = z.object({
  key: z.string().min(1, "File key is required").max(1024, "File key too long"),
});

export const processAndUploadFileSchema = z.object({
  contentType: z.enum(allowedTypes as [string, ...string[]], {
    error: `Invalid content type. Allowed types: ${allowedTypes.join(", ")}`,
  }),
  prefix: z.string().min(1).max(100).optional(),
});
