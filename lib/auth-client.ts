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

export const authClient = createAuthClient({
  baseURL: getClientBaseUrl(),
  plugins: [organizationClient(), adminClient(), lastLoginMethodClient()],
});

export const { signOut, useSession } = authClient;
