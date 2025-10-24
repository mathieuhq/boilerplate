import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";
import { getServerUrl } from "./server-url";
import { env } from "@/lib/env";
import { nextCookies } from "better-auth/next-js";

type SocialProvidersType = Parameters<typeof betterAuth>[0]["socialProviders"];

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

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  baseURL: getServerUrl(),
  session: {
    expiresIn: 60 * 60 * 24 * 20,
    updateAge: 60 * 60 * 24 * 7,
  },
  socialProviders: SocialProviders,
  plugins: [
    // Warning: always last plugin
    nextCookies(),
  ],
});
