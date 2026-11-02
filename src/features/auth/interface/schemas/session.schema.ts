import { z } from "zod";

export const revokeUserSessionSchema = z.object({
  sessionId: z.string().min(1),
});
