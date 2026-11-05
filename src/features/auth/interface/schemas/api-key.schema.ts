import { z } from "zod";

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(64),
});

export const revokeApiKeySchema = z.object({
  keyId: z.string().min(1),
});
