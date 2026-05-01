import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, lastLoginMethod, organization } from "better-auth/plugins";

import { MarkdownEmail } from "@/components/features/email/email-markdown";
import { db } from "@/lib/db";
import { getGithubOAuthConfig, getGoogleOAuthConfig } from "@/lib/env";
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
const githubOAuthConfig = getGithubOAuthConfig();
const googleOAuthConfig = getGoogleOAuthConfig();

if (githubOAuthConfig)
  SocialProviders.github = {
    clientId: githubOAuthConfig.clientId,
    clientSecret: githubOAuthConfig.clientSecret,
  };

if (googleOAuthConfig)
  SocialProviders.google = {
    clientId: googleOAuthConfig.clientId,
    clientSecret: googleOAuthConfig.clientSecret,
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
  database: prismaAdapter(db, {
    provider: "postgresql",
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
                emailContactId: result.contactId,
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

          try {
            const emailPrefix = user.email
              .split("@")[0]
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-");
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const slug = `${emailPrefix}-${randomSuffix}`;

            const organization = await db.organization.create({
              data: {
                name: "My Organization",
                slug,
              },
            });

            await db.member.create({
              data: {
                organizationId: organization.id,
                userId: user.id,
                role: "owner",
              },
            });

            logger.info("Organization created for new user", {
              userId: user.id,
              organizationId: organization.id,
            });
          } catch (error) {
            logger.error("Error creating organization for user", {
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
      sendChangeEmailVerification: async ({
        newEmail,
        url,
      }: {
        newEmail: string;
        url: string;
      }) => {
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
    lastLoginMethod(),
    nextCookies(),
  ],
});
