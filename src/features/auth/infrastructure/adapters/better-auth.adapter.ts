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
        email: session.user.email,
        name: session.user.name,
        image: session.user.image ?? undefined,
        role: session.user.role ?? undefined,
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
      periodStart: sub.periodStart ?? undefined,
      periodEnd: sub.periodEnd ?? undefined,
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
      id: result.id,
      email: result.email,
      name: result.name,
      image: result.image ?? undefined,
      role: result.role ?? undefined,
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
        email: user.email,
        name: user.name,
        image: user.image ?? undefined,
        role: user.role ?? undefined,
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
