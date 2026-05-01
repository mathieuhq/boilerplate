import {
  adminClient,
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

function getClientBaseUrl() {
  if (typeof window === "undefined") return undefined;

  return window.location.origin;
}

/**
 * Client-side authentication instance for React components
 */
export const authClient = createAuthClient({
  baseURL: getClientBaseUrl(),
  plugins: [organizationClient(), adminClient(), lastLoginMethodClient()],
});

/**
 * Auth hooks for client components
 */
export const { signOut, useSession } = authClient;
