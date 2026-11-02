import { createServerFn } from "@tanstack/react-start";

import { auth } from "@/lib/auth";
import { getServerRequestHeaders } from "@/lib/request";
import { container } from "@/shared/infrastructure/di/container";

async function getCurrentSession() {
  return auth.api.getSession({
    headers: getServerRequestHeaders(),
  });
}

async function getSessionUser() {
  const session = await getCurrentSession();

  return session?.user ?? null;
}

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await getSessionUser();

    return user ? { user } : null;
  },
);

export const requireSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getCurrentSession();

    if (!session?.user) return null;

    const { user } = session;
    const access = await container
      .getAdminController()
      .resolveAccess(user.role);
    const impersonation = session.session.impersonatedBy
      ? { expiresAt: session.session.expiresAt.toISOString() }
      : null;

    return { user, access, impersonation };
  },
);
