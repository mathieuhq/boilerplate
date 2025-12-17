import { z } from "zod";

import { createEnv } from "@t3-oss/env-nextjs";

/**
 * Type-safe environment variables with validation
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    DATABASE_URL: z.url(),

    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_ADMIN_EMAIL: z.email().optional(),

    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    EMAIL_FROM: z.email(),
    RESEND_API_KEY: z.string().min(1),
    RESEND_AUDIENCE_ID: z.string().min(1),

    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_PRO_PRICE_ID: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    STRIPE_PRO_ANNUAL_PRICE_ID: z.string().optional(),

    GLITCHTIP_DSN: z.url().optional(),
  },
  client: {
    NEXT_PUBLIC_GLITCHTIP_DSN: z.url().optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_GLITCHTIP_DSN: process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
  },
});
