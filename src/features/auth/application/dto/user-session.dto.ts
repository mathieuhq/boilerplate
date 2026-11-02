import type { Session } from "../../domain/entities/session.entity";
import type { DeviceType } from "../../domain/value-objects/user-agent.vo";

export type UserSessionDTO = {
  id: string;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  deviceType: DeviceType;
  ipAddress: string | null;
  lastActiveAt: string | null;
  expiresAt: string;
  isCurrent: boolean;
};

export type UserSessionListDTO = {
  sessions: UserSessionDTO[];
  canManage: boolean;
};

export function toUserSessionDTO(
  session: Session,
  currentSessionId: string,
): UserSessionDTO {
  const device = session.device;

  return {
    id: session.id,
    browser: device.browser,
    browserVersion: device.browserVersion,
    os: device.os,
    deviceType: device.deviceType,
    ipAddress: session.ipAddress ?? null,
    lastActiveAt: session.lastActiveAt?.toISOString() ?? null,
    expiresAt: session.expiresAt.toISOString(),
    isCurrent: session.id === currentSessionId,
  };
}
