import {
  adminClient,
  lastLoginMethodClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { passkeyClient } from "@better-auth/passkey/client";

function getClientBaseUrl() {
  if (typeof window === "undefined") return undefined;

  return window.location.origin;
}

export const authClient = createAuthClient({
  baseURL: getClientBaseUrl(),
  plugins: [
    organizationClient(),
    adminClient(),
    twoFactorClient(),
    passkeyClient(),
    lastLoginMethodClient(),
  ],
});

export const { signOut } = authClient;
