import { z } from "zod";

import { ContentType } from "../../domain/value-objects/content-type.value-object";

const allowedTypes = ContentType.getAllowedTypes();
const allowedPrefixes = [
  "uploads",
  "user-avatars",
  "organization-avatars",
] as const;

export const processAndUploadFileSchema = z.object({
  contentType: z.enum(allowedTypes as [string, ...string[]], {
    error: `Invalid content type. Allowed types: ${allowedTypes.join(", ")}`,
  }),
  prefix: z.enum(allowedPrefixes).optional(),
});
