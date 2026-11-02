import { z } from "zod";

export const listNotificationsSchema = z.object({
  limit: z.number().int().min(1).max(50),
  cursor: z.string().min(1).optional(),
});

export const markNotificationsReadSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});
