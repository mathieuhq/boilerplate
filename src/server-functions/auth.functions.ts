import { createServerFn } from "@tanstack/react-start";

import { auth } from "@/lib/auth";
import { getServerRequestHeaders } from "@/lib/request";

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

    return user ? { user } : null;
  },
);

export const requireAdmin = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await getSessionUser();

    return user?.role === "admin" ? { user } : null;
  },
);
