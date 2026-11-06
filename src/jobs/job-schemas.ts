import { z } from "zod";

import { isSafeNotificationLink } from "@/features/notification/domain/notification-link";
import {
  ACCESS_FEATURE_KEYS,
  ACCESS_LEVELS,
} from "@/shared/domain/access-control";
import type { JobSchemas } from "@/shared/infrastructure/jobs/job-processor";

import type { AppJobs } from "./jobs";

const emptyPayload = z.strictObject({});
const recipients = z.union([z.string(), z.array(z.string())]);

const notificationAudience = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("users"), userIds: z.array(z.string()) }),
  z.object({
    kind: z.literal("organization"),
    organizationId: z.string(),
    roles: z.array(z.string()).optional(),
  }),
  z.object({
    kind: z.literal("access"),
    feature: z.enum(ACCESS_FEATURE_KEYS),
    level: z.enum(ACCESS_LEVELS),
  }),
]);

const notificationFields = {
  audience: notificationAudience,
  link: z.string().refine(isSafeNotificationLink).optional(),
  excludeUserIds: z.array(z.string()).optional(),
};

export const jobSchemas: JobSchemas<AppJobs> = {
  "email.send": z.object({
    html: z.string(),
    subject: z.string(),
    to: recipients,
    from: z.string().optional(),
    text: z.string().optional(),
    replyTo: z.string().optional(),
    cc: recipients.optional(),
    bcc: recipients.optional(),
    attachments: z
      .array(
        z.object({
          content: z.string().optional(),
          contentType: z.string().optional(),
          filename: z.union([z.string(), z.literal(false)]).optional(),
        }),
      )
      .optional(),
  }),
  "auth.purge-expired-records": emptyPayload,
  "notification.dispatch": z.discriminatedUnion("type", [
    z.object({
      ...notificationFields,
      type: z.literal("system.message"),
      data: z.object({ title: z.string(), body: z.string().optional() }),
    }),
    z.object({
      ...notificationFields,
      type: z.literal("user.data-export-ready"),
      data: z.object({ expiresOn: z.string() }),
    }),
  ]),
  "notification.purge-read": emptyPayload,
  "user.export-data": z.object({ exportId: z.string() }),
  "user.purge-expired-data-exports": emptyPayload,
};
