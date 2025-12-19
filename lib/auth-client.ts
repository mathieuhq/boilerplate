import { adminClient, lastLoginMethodClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { getServerUrl } from "@/lib/server-url";
import { stripeClient } from "@better-auth/stripe/client";

/**
 * Client-side authentication instance for React components
 */
export const authClient = createAuthClient({
  baseURL: getServerUrl(),
  plugins: [
    stripeClient({
      subscription: true,
    }),
    adminClient(),
    lastLoginMethodClient(),
  ],
});

/**
 * Auth hooks for client components
 */
export const { useSession, signOut } = authClient;
