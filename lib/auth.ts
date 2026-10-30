import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, lastLoginMethod, organization } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { render } from "react-email";

import { MarkdownEmail } from "@/components/features/email/email-markdown";
import { db } from "@/lib/db";
import {
  env,
  getGithubOAuthConfig,
  getGoogleOAuthConfig,
  getRateLimitConfig,
  getTrustedOrigins,
} from "@/lib/env";
import { logger } from "@/lib/logger";
import { ApplicationError } from "@/shared/domain/errors/application.error";
import { container } from "@/shared/infrastructure/di/container";
import { Redis } from "@upstash/redis";

import { getServerUrl } from "./server-url";
import { SITE_CONFIG } from "./site-config";

type SocialProvidersType = Parameters<typeof betterAuth>[0]["socialProviders"];

const SocialProviders: SocialProvidersType = {};

const rateLimitConfig = getRateLimitConfig();
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

const createSecondaryStorage = () => {
  if (!rateLimitConfig) return undefined;

  const redis = new Redis({
    url: rateLimitConfig.url,
    token: rateLimitConfig.token,
  });

  return {
    get: async (key: string) => redis.get(key),
    getAndDelete: async (key: string) => redis.getdel(key),
    increment: async (key: string, ttl: number) =>
      redis.eval<[number], number>(
        "local v = redis.call('INCR', KEYS[1]) if v == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end return v",
        [key],
        [ttl],
      ),
    set: async (key: string, value: string, ttl?: number) =>
      ttl ? redis.set(key, value, { ex: ttl }) : redis.set(key, value),
    delete: async (key: string) => {
      await redis.del(key);
    },
  };
};

const secondaryStorage = createSecondaryStorage();
const isProduction = env.NODE_ENV === "production";

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

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  baseURL: getServerUrl(),
  trustedOrigins: getTrustedOrigins(),
  secondaryStorage,
  rateLimit: {
    max: 100,
    window: 60,
    enabled: true,
    storage: secondaryStorage ? "secondary-storage" : "memory",
  },
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
            await adminController.promoteToAdminIfConfigured(
              user.id,
              user.email,
            );
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
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
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
      sendChangeEmailConfirmation: async ({
        url,
        user,
        newEmail,
      }: {
        url: string;
        newEmail: string;
        user: { email: string };
      }) => {
        await sendEmail({
          to: user.email,
          subject: "Confirm email address change",
          preview: `Confirm your email address change for ${SITE_CONFIG.TITLE}`,
          markdown: `
            Hello,

            You requested to change your email address to ${newEmail}.

            [Click here to approve this change](${url})
            `,
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
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
    sendOnSignUp: true,
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
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
    },
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"],
      ipv6Subnet: 64,
    },
  },
  socialProviders: SocialProviders,
  plugins: [
    organization({
      organizationLimit: 5,
      membershipLimit: 100,
      invitationExpiresIn: 60 * 60 * 48,
      allowUserToCreateOrganization: true,
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
    tanstackStartCookies(),
  ],
});
