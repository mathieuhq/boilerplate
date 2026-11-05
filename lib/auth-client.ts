import {
  adminClient,
  lastLoginMethodClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { passkeyClient } from "@better-auth/passkey/client";
import { stripeClient } from "@better-auth/stripe/client";

function getClientBaseUrl() {
  if (typeof window === "undefined") return undefined;

  return window.location.origin;
}

export const authClient = createAuthClient({
  baseURL: getClientBaseUrl(),
  basePath: "/api/v1/private/auth",
  plugins: [
    organizationClient(),
    adminClient(),
    twoFactorClient(),
    passkeyClient(),
    lastLoginMethodClient(),
    stripeClient({ subscription: true }),
  ],
});

export const { signOut } = authClient;
