import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import type {
  AuthSession,
  AuthUser,
  IAuthProviderPort,
  ListUsersParams,
  ListUsersResult,
  Subscription,
} from "../../application/ports/auth-provider.port";

export class BetterAuthAdapter implements IAuthProviderPort {
  async getSession(): Promise<AuthSession | null> {
    const session = await auth.api.getSession({
      headers: await headers(),
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

    if (!user) redirect("/auth/signin");

    return user;
  }

  async getActiveSubscriptions(): Promise<Subscription[]> {
    const subscriptions = await auth.api.listActiveSubscriptions({
      headers: await headers(),
    });

    return subscriptions.map((sub) => ({
      id: sub.id,
      plan: sub.plan,
      status: sub.status,
      periodEnd: sub.periodEnd ?? undefined,
      periodStart: sub.periodStart ?? undefined,
    }));
  }

  async setUserRole(userId: string, role: "user" | "admin"): Promise<void> {
    await auth.api.setRole({
      body: { userId, role },
      headers: await headers(),
    });
  }

  async createUser(data: {
    email: string;
    password: string;
    name: string;
    role?: "user" | "admin";
  }): Promise<AuthUser> {
    const result = await auth.api.createUser({
      body: data,
      headers: await headers(),
    });

    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role ?? undefined,
      image: result.user.image ?? undefined,
    };
  }

  async removeUser(userId: string): Promise<void> {
    await auth.api.removeUser({
      body: { userId },
      headers: await headers(),
    });
  }

  async listUsers(params: ListUsersParams): Promise<ListUsersResult> {
    const result = await auth.api.listUsers({
      query: params,
      headers: await headers(),
    });

    return {
      users: result.users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role ?? undefined,
        image: user.image ?? undefined,
      })),
      total: result.total,
    };
  }

  async setUserPassword(userId: string, newPassword: string): Promise<void> {
    await auth.api.setUserPassword({
      body: { userId, newPassword },
      headers: await headers(),
    });
  }
}
