import { Session } from "../../domain/entities/session.entity";
import type { UserSessionRecord } from "../ports/session-management.port";

export function toSessionEntity(record: UserSessionRecord): Session {
  return Session.create({
    id: record.id,
    userId: record.userId,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ipAddress: record.ipAddress ?? undefined,
    userAgent: record.userAgent ?? undefined,
    impersonatedBy: record.impersonatedBy,
  });
}

export function describeSession(session: Session) {
  const device = session.device;

  return {
    sessionId: session.id,
    browser: device.browser,
    os: device.os,
    deviceType: device.deviceType,
  };
}
