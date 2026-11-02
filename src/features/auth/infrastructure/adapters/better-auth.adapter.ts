import { auth } from "@/lib/auth";
import { getServerRequestHeaders } from "@/lib/request";
import { HttpError } from "@/shared/domain/errors/http.error";

import type {
  AuthSession,
  AuthUser,
  IAuthProviderPort,
} from "../../application/ports/auth-provider.port";
import type {
  IImpersonationPort,
  StartedImpersonation,
} from "../../application/ports/impersonation.port";
import type {
  ISessionManagementPort,
  UserSessionRecord,
} from "../../application/ports/session-management.port";

type BetterAuthSessionRecord = {
  id: string;
  token: string;
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  impersonatedBy?: string | null;
};

export class BetterAuthAdapter
  implements IAuthProviderPort, ISessionManagementPort, IImpersonationPort
{
  async getSession(): Promise<AuthSession | null> {
    const session = await auth.api.getSession({
      headers: getServerRequestHeaders(),
    });

    if (!session) return null;

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role ?? undefined,
        image: session.user.image ?? undefined,
      },
      session: {
        id: session.session.id,
        userId: session.session.userId,
        expiresAt: session.session.expiresAt,
        activeOrganizationId: session.session.activeOrganizationId ?? null,
        impersonatedBy: session.session.impersonatedBy ?? null,
      },
    };
  }

  async getUser(): Promise<AuthUser | null> {
    const session = await this.getSession();

    if (!session?.user) return null;

    return session.user;
  }

  async getRequiredUser(): Promise<AuthUser> {
    const user = await this.getUser();

    if (!user) throw HttpError.unauthorized();

    return user;
  }

  async setUserRole(userId: string, role: "user" | "admin"): Promise<void> {
    const context = await auth.$context;

    await context.internalAdapter.updateUser(userId, { role });
  }

  async revokeUserSessions(userId: string): Promise<void> {
    const context = await auth.$context;

    await context.internalAdapter.deleteUserSessions(userId);
  }

  async listSessions(userId: string): Promise<UserSessionRecord[]> {
    const context = await auth.$context;
    const sessions = (await context.internalAdapter.listSessions(userId, {
      onlyActiveSessions: true,
    })) as BetterAuthSessionRecord[];

    return sessions.map((session) => ({
      id: session.id,
      token: session.token,
      userId: session.userId,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      expiresAt: new Date(session.expiresAt),
      impersonatedBy: session.impersonatedBy ?? null,
    }));
  }

  async revokeSession(token: string): Promise<void> {
    await auth.api.revokeSession({
      body: { token },
      headers: getServerRequestHeaders(),
    });
  }

  async revokeOtherSessions(): Promise<void> {
    await auth.api.revokeOtherSessions({
      headers: getServerRequestHeaders(),
    });
  }

  async startImpersonation(
    userId: string,
    expiresInSeconds: number,
  ): Promise<StartedImpersonation> {
    const result = await auth.api.startImpersonation({
      body: { userId, expiresIn: expiresInSeconds },
      headers: getServerRequestHeaders(),
    });

    return { expiresAt: new Date(result.expiresAt) };
  }

  async stopImpersonation(): Promise<void> {
    await auth.api.stopImpersonating({
      headers: getServerRequestHeaders(),
    });
  }
}
