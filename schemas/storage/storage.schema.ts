import { z } from "zod";

/**
 * Validates file upload parameters
 * Accepts file as Buffer, Uint8Array, or base64 string
 */
export const uploadFileSchema = z.object({
  file: z.union([
    z.instanceof(Buffer),
    z.instanceof(Uint8Array),
    z.string().regex(/^[A-Za-z0-9+/=]+$/, "Invalid base64 string"),
  ]),
  filename: z.string().min(1, "Filename is required").optional(),
  contentType: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  prefix: z.string().optional(),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;

/**
 * Validates single file deletion
 */
export const deleteFileSchema = z.object({
  key: z
    .string()
    .min(1, "File key is required")
    .max(1024, "File key too long"),
});

export type DeleteFileInput = z.infer<typeof deleteFileSchema>;

/**
 * Validates bulk file deletion
 */
export const bulkDeleteFilesSchema = z.object({
  keys: z
    .array(z.string().min(1).max(1024))
    .min(1, "At least one key is required")
    .max(1000, "Cannot delete more than 1000 files at once"),
});

export type BulkDeleteFilesInput = z.infer<typeof bulkDeleteFilesSchema>;

/**
 * Validates signed URL generation
 */
export const getSignedUrlSchema = z.object({
  key: z
    .string()
    .min(1, "File key is required")
    .max(1024, "File key too long"),
  expiresIn: z
    .number()
    .int()
    .min(1, "Expiration must be at least 1 second")
    .max(604800, "Expiration cannot exceed 7 days")
    .optional()
    .default(3600),
  operation: z.enum(["getObject", "putObject"]).optional().default("getObject"),
});

export type GetSignedUrlInput = z.infer<typeof getSignedUrlSchema>;

/**
 * Validates file listing query parameters
 */
export const listFilesQuerySchema = z.object({
  prefix: z.string().optional(),
  maxKeys: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(1000))
    .optional(),
  continuationToken: z.string().optional(),
});

export type ListFilesQuery = z.infer<typeof listFilesQuerySchema>;

/**
 * Validates file existence check
 */
export const fileExistsQuerySchema = z.object({
  key: z
    .string()
    .min(1, "File key is required")
    .max(1024, "File key too long"),
});

export type FileExistsQuery = z.infer<typeof fileExistsQuerySchema>;

/**
 * Validates file download
 */
export const downloadFileQuerySchema = z.object({
  key: z
    .string()
    .min(1, "File key is required")
    .max(1024, "File key too long"),
});

export type DownloadFileQuery = z.infer<typeof downloadFileQuerySchema>;
