import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";
import { getServerUrl } from "@/lib/server-url";
import { adminClient, lastLoginMethodClient } from "better-auth/client/plugins";

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
