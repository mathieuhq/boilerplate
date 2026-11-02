import { createServerFn } from "@tanstack/react-start";

import { auth } from "@/lib/auth";
import { getServerRequestHeaders } from "@/lib/request";
import { container } from "@/shared/infrastructure/di/container";

async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: getServerRequestHeaders(),
  });

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
    const user = await getSessionUser();

    if (!user) return null;

    const access = await container
      .getAdminController()
      .resolveAccess(user.role);

    return { user, access };
  },
);
