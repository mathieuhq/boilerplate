import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import type {
  AuthSession,
  AuthUser,
  IAuthProviderPort,
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

  async setUserRole(userId: string, role: "user" | "admin"): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: { role },
    });
  }
}
