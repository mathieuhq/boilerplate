import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockAuthProvider } from "@/test/utils/mock-factories";

import type { SessionOperationError } from "../errors/session-operation.error";
import type { IAuthProviderPort } from "../ports/auth-provider.port";
import type { ISessionManagementPort } from "../ports/session-management.port";
import { ListUserSessionsUseCase } from "../use-cases/list-user-sessions.use-case";

import {
  createAuthSession,
  createMockSessionManagement,
  createSessionRecord,
} from "./session-management.mock";

describe("ListUserSessionsUseCase", () => {
  let authProvider: IAuthProviderPort;
  let sessionManagement: ISessionManagementPort;
  let useCase: ListUserSessionsUseCase;

  beforeEach(() => {
    authProvider = createMockAuthProvider();
    sessionManagement = createMockSessionManagement();
    useCase = new ListUserSessionsUseCase(authProvider, sessionManagement);
  });

  it("should fail without a session", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(null);

    const result = await useCase.execute({});

    expect(result.isFailure).toBe(true);
    expect((result.error as SessionOperationError).code).toBe(
      "SESSION_REQUIRED",
    );
    expect(sessionManagement.listSessions).not.toHaveBeenCalled();
  });

  it("should list sessions with the current one first and most recent next", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(createAuthSession());
    vi.mocked(sessionManagement.listSessions).mockResolvedValue([
      createSessionRecord({
        id: "session-old",
        token: "token-old",
        ipAddress: null,
        userAgent: null,
        updatedAt: new Date("2026-09-01T10:00:00.000Z"),
      }),
      createSessionRecord(),
      createSessionRecord({
        id: "session-recent",
        token: "token-recent",
        updatedAt: new Date("2026-11-02T08:00:00.000Z"),
      }),
    ]);

    const result = await useCase.execute({});

    expect(sessionManagement.listSessions).toHaveBeenCalledWith("user-1");
    expect(result.value.canManage).toBe(true);
    expect(result.value.sessions.map((session) => session.id)).toEqual([
      "session-current",
      "session-recent",
      "session-old",
    ]);
    expect(result.value.sessions[0]).toEqual({
      id: "session-current",
      browser: "Chrome",
      browserVersion: "130",
      os: "macOS",
      deviceType: "desktop",
      ipAddress: "203.0.113.10",
      lastActiveAt: "2026-11-01T10:00:00.000Z",
      expiresAt: "2099-01-01T00:00:00.000Z",
      isCurrent: true,
    });
    expect(result.value.sessions[2]).toMatchObject({
      browser: null,
      os: null,
      ipAddress: null,
      isCurrent: false,
    });
    expect(result.value.sessions[0]).not.toHaveProperty("token");
  });

  it("should hide expired and other impersonation sessions", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(createAuthSession());
    vi.mocked(sessionManagement.listSessions).mockResolvedValue([
      createSessionRecord(),
      createSessionRecord({
        id: "session-expired",
        expiresAt: new Date("2020-01-01"),
      }),
      createSessionRecord({
        id: "session-impersonated",
        impersonatedBy: "admin-1",
      }),
    ]);

    const result = await useCase.execute({});

    expect(result.value.sessions.map((session) => session.id)).toEqual([
      "session-current",
    ]);
  });

  it("should keep the current impersonation session and disable management", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(
      createAuthSession({ impersonatedBy: "admin-1" }),
    );
    vi.mocked(sessionManagement.listSessions).mockResolvedValue([
      createSessionRecord({ impersonatedBy: "admin-1" }),
      createSessionRecord({ id: "session-phone", token: "token-phone" }),
    ]);

    const result = await useCase.execute({});

    expect(result.value.canManage).toBe(false);
    expect(result.value.sessions.map((session) => session.id)).toEqual([
      "session-current",
      "session-phone",
    ]);
  });

  it("should sort sessions without activity last", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(
      createAuthSession({ id: "session-elsewhere" }),
    );
    vi.mocked(sessionManagement.listSessions).mockResolvedValue([
      {
        ...createSessionRecord({ id: "session-a" }),
        updatedAt: undefined as unknown as Date,
        createdAt: undefined as unknown as Date,
      },
      createSessionRecord({ id: "session-b" }),
      {
        ...createSessionRecord({ id: "session-c" }),
        updatedAt: undefined as unknown as Date,
        createdAt: undefined as unknown as Date,
      },
    ]);

    const result = await useCase.execute({});

    expect(result.value.sessions.map((session) => session.id)).toEqual([
      "session-b",
      "session-a",
      "session-c",
    ]);
    expect(result.value.sessions[1].lastActiveAt).toBeNull();
  });
});
