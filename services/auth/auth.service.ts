import { headers } from "next/headers";
import { unauthorized } from "next/navigation";

import { auth } from "@/lib/auth";

class AuthService {
  async getSession() {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return session;
  }

  async getUser() {
    const session = await this.getSession();

    if (!session?.user) return null;

    const user = session.user;

    return user;
  }

  async getRequiredUser() {
    const user = await this.getUser();

    if (!user) unauthorized();

    return user;
  }
}

export const authService = new AuthService();
