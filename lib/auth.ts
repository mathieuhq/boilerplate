import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, organization } from "better-auth/plugins";

import { MarkdownEmail } from "@/components/features/email/email-markdown";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { ApplicationError } from "@/shared/domain/errors/application.error";
import { container } from "@/shared/infrastructure/di/container";
import { render } from "@react-email/render";

import { getServerUrl } from "./server-url";
import { SITE_CONFIG } from "./site-config";

type SocialProvidersType = Parameters<typeof betterAuth>[0]["socialProviders"];

/**
 * Configured social authentication providers based on environment variables
 */
const SocialProviders: SocialProvidersType = {};

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

  const emailController = container.getEmailController();

  const result = await emailController.sendEmail({
    html,
    to: params.to,
    subject: params.subject,
  });

  if (!result.success) {
    logger.error("Failed to send email", {
      to: params.to,
      error: result.error,
      subject: params.subject,
    });

    throw new ApplicationError(result.error ?? "Failed to send email");
  }
};

/**
 * Server-side authentication instance with Better Auth
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: getServerUrl(),
  session: {
    expiresIn: 60 * 60 * 24 * 20,
    updateAge: 60 * 60 * 24 * 7,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const emailController = container.getEmailController();
            const result = await emailController.subscribeContact({
              name: user.name,
              email: user.email,
            });

            if (result.success) {
              logger.info("User subscribed to email audience", {
                userId: user.id,
                resendContactId: result.contactId,
              });
            } else {
              logger.warn("Failed to subscribe user to email audience", {
                userId: user.id,
              });
            }
          } catch (error) {
            logger.error("Error subscribing user to email audience", {
              error,
              userId: user.id,
            });
          }

          try {
            const adminController = container.getAdminController();
            await adminController.promoteToAdminIfOriginal(user.id, user.email);
          } catch (error) {
            logger.error("Error promoting user to admin", {
              error,
              userId: user.id,
            });
          }
        },
      },
    },
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
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      membershipLimit: 100,
      invitationExpiresIn: 60 * 60 * 48,
      sendInvitationEmail: async (data) => {
        const inviteUrl = `${getServerUrl()}/auth/accept-invitation/${data.id}`;
        await sendEmail({
          to: data.email,
          subject: `Invitation to join ${data.organization.name}`,
          preview: `${data.inviter.user.name} invited you to join ${data.organization.name}`,
          markdown: `
            Hello,

            ${data.inviter.user.name} has invited you to join **${data.organization.name}**.

            [Accept Invitation](${inviteUrl})

            This invitation expires in 48 hours.
          `,
        });
      },
    }),
    admin(),
    nextCookies(),
  ],
});
