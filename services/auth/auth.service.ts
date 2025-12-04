import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

/**
 * Service layer for authentication operations
 */
class AuthService {
  /**
   * Gets the current session
   */
  async getSession() {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return session;
  }

  /**
   * Gets the current user or null if not authenticated
   */
  async getUser() {
    const session = await this.getSession();

    if (!session?.user) return null;

    const user = session.user;

    return user;
  }

  /**
   * Gets the current user or redirects to signin page
   */
  async getRequiredUser() {
    const user = await this.getUser();

    if (!user) redirect("/auth/signin");

    return user;
  }

  /**
   * Gets active subscriptions for the current user
   */
  async getActiveSubscriptions() {
    const subscriptions = await auth.api.listActiveSubscriptions({
      headers: await headers(),
    });

    return subscriptions;
  }
}

export const authService = new AuthService();
