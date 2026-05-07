import { createServerFn } from "@tanstack/react-start";

import { auth } from "@/lib/auth";
import { getServerRequestHeaders } from "@/lib/request";

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    return auth.api.getSession({
      headers: getServerRequestHeaders(),
    });
  },
);

export const requireSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getServerRequestHeaders(),
    });

    if (!session?.user) return null;

    return session;
  },
);

export const requireAdmin = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getServerRequestHeaders(),
    });

    if (session?.user.role !== "admin") return null;

    return session;
  },
);
