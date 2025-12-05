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

  /**
   * Sets the role for a user (admin plugin)
   */
  async setUserRole(userId: string, role: "user" | "admin") {
    const result = await auth.api.setRole({
      body: { userId, role },
      headers: await headers(),
    });

    return result;
  }

  /**
   * Creates a new user (admin plugin)
   */
  async createUser(data: {
    email: string;
    password: string;
    name: string;
    role?: "user" | "admin";
  }) {
    const result = await auth.api.createUser({
      body: data,
      headers: await headers(),
    });

    return result;
  }

  /**
   * Removes a user (admin plugin)
   */
  async removeUser(userId: string) {
    const result = await auth.api.removeUser({
      body: { userId },
      headers: await headers(),
    });

    return result;
  }

  /**
   * Lists users with pagination and search (admin plugin)
   */
  async listUsers(params: {
    searchValue?: string;
    searchField?: "email" | "name";
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
  }) {
    const result = await auth.api.listUsers({
      query: params,
      headers: await headers(),
    });

    return result;
  }

  /**
   * Sets the password for a user (admin plugin)
   */
  async setUserPassword(userId: string, newPassword: string) {
    const result = await auth.api.setUserPassword({
      body: { userId, newPassword },
      headers: await headers(),
    });

    return result;
  }
}

export const authService = new AuthService();
