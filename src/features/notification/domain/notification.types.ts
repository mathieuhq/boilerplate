import type {
  AccessFeature,
  AccessLevel,
} from "@/shared/domain/access-control";

export type NotificationPayloads = {
  "system.message": { title: string; body?: string };
};

export type NotificationType = keyof NotificationPayloads;

export type NotificationData = Record<
  string,
  string | number | boolean | null | undefined
>;

export type NotificationAudience =
  | { kind: "users"; userIds: string[] }
  | { kind: "organization"; organizationId: string; roles?: string[] }
  | { kind: "access"; feature: AccessFeature; level: AccessLevel };

export type Notification = {
  id: string;
  userId: string;
  type: string;
  data: NotificationData;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};
