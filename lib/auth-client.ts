import {
  adminClient,
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { getServerUrl } from "@/lib/server-url";

/**
 * Client-side authentication instance for React components
 */
export const authClient = createAuthClient({
  baseURL: getServerUrl(),
  plugins: [organizationClient(), adminClient(), lastLoginMethodClient()],
});

/**
 * Auth hooks for client components
 */
export const {
  useSession,
  signOut,
  useActiveOrganization,
  useListOrganizations,
} = authClient;
