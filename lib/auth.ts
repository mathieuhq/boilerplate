import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, lastLoginMethod } from "better-auth/plugins";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { stripeAdapter } from "@/services/payment/payment.service";
import { stripe as stripePlugin } from "@better-auth/stripe";

import { getServerUrl } from "./server-url";
import { SITE_CONFIG } from "./site-config";

type SocialProvidersType = Parameters<typeof betterAuth>[0]["socialProviders"];

/**
 * Configured social authentication providers based on environment variables
 */
export const SocialProviders: SocialProvidersType = {};

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
  SocialProviders.github = {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  };

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
  SocialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };

/**
 * Server-side authentication instance with Better Auth
 */
export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  baseURL: getServerUrl(),
  session: {
    expiresIn: 60 * 60 * 24 * 20,
    updateAge: 60 * 60 * 24 * 7,
  },
  advanced: {
    cookiePrefix: SITE_CONFIG.APP_ID,
  },
  socialProviders: SocialProviders,
  plugins: [
    stripePlugin({
      createCustomerOnSignUp: true,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
      stripeClient: stripeAdapter.getStripeInstance(),
    }),
    admin(),
    lastLoginMethod(),
    nextCookies(),
  ],
});
