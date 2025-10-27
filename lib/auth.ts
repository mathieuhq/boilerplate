import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { lastLoginMethod } from "better-auth/plugins";

import { MarkdownEmail } from "@/components/features/email/email-markdown";
import { emailController } from "@/controllers/email.controller";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { stripeAdapter } from "@/services/payment/payment.service";
import { stripe as stripePlugin } from "@better-auth/stripe";
import { render } from "@react-email/render";

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
 * Helper function to send emails using the email controller
 */
const sendEmail = async (params: {
  to: string;
  subject: string;
  markdown: string;
  preview?: string;
}) => {
  const html = await render(
    MarkdownEmail({
      preview: params.preview,
      markdown: params.markdown,
    }),
  );

  await emailController.sendEmail({
    html,
    to: params.to,
    subject: params.subject,
  });
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
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        preview: `Reset your password for ${SITE_CONFIG.TITLE}`,
        markdown: `
          Hello,

          You requested to reset your password.

          [Click here to reset your password](${url})
          `,
      });
    },
  },
  user: {
    additionalFields: {
      birthDate: {
        type: "date",
        required: false,
      },
      language: {
        type: "string",
        required: false,
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ newEmail, url }) => {
        await sendEmail({
          to: newEmail,
          subject: "Change email address",
          preview: `Change your email address for ${SITE_CONFIG.TITLE}`,
          markdown: `
            Hello,

            You requested to change your email address.

            [Click here to verify your new email address](${url})
            `,
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, token }) => {
        const url = `${getServerUrl()}/auth/confirm-delete?token=${token}&callbackUrl=/auth/goodbye`;
        await sendEmail({
          to: user.email,
          subject: "Delete your account",
          preview: `Delete your account from ${SITE_CONFIG.TITLE}`,
          markdown: `
            Hello,

            You requested to delete your account.

            [Click here to confirm account deletion](${url})
            `,
        });
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        preview: `Verify your email for ${SITE_CONFIG.TITLE}`,
        markdown: `
          Hello,

          Welcome to ${SITE_CONFIG.TITLE}! Please verify your email address.

          [Click here to verify your email](${url})
          `,
      });
    },
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
    lastLoginMethod(),
    nextCookies(),
  ],
});
