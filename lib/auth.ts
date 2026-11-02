import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import {
  admin,
  jwt,
  lastLoginMethod,
  organization,
  twoFactor,
} from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { render } from "react-email";

import { MarkdownEmail } from "@/components/features/email/email-markdown";
import { escapeMarkdown } from "@/features/email/application/services/escape-markdown";
import { authDatabase } from "@/lib/auth-database";
import { db } from "@/lib/db";
import {
  env,
  getGithubOAuthConfig,
  getGoogleOAuthConfig,
  getTrustedOrigins,
} from "@/lib/env";
import { logger } from "@/lib/logger";
import { redis } from "@/lib/redis";
import { CacheKeys } from "@/shared/application/cache-keys";
import { ApplicationError } from "@/shared/domain/errors/application.error";
import { container } from "@/shared/infrastructure/di/container";
import { RESOLVED_CLIENT_IP_HEADER } from "@/shared/infrastructure/http/client-ip";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { mcp } from "@better-auth/mcp";
import { passkey } from "@better-auth/passkey";

import { getMcpResourceUrl } from "./mcp/resource";
import { mcpSessionBridge } from "./mcp/session-bridge";
import { getServerUrl } from "./server-url";
import { SITE_CONFIG } from "./site-config";

type SocialProvidersType = Parameters<typeof betterAuth>[0]["socialProviders"];

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

const createSecondaryStorage = () => {
  const client = redis;

  if (!client) return undefined;

  return {
    get: async (key: string) => client.get(key),
    getAndDelete: async (key: string) => client.getdel(key),
    increment: async (key: string, ttl: number) =>
      Number(
        await client.eval(
          "local v = redis.call('INCR', KEYS[1]) if v == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end return v",
          1,
          key,
          ttl,
        ),
      ),
    set: async (key: string, value: string, ttl?: number) =>
      ttl ? client.set(key, value, "EX", ttl) : client.set(key, value),
    delete: async (key: string) => {
      await client.del(key);
    },
  };
};

const secondaryStorage = createSecondaryStorage();

const CLIENT_IMAGE_PATHS = new Set(["/sign-up/email", "/update-user"]);

const rejectClientStorageKeys = createAuthMiddleware(async (ctx) => {
  if (!ctx.request) return;

  const body = (ctx.body ?? {}) as {
    image?: unknown;
    logo?: unknown;
    data?: { logo?: unknown };
  };

  const setsImage =
    CLIENT_IMAGE_PATHS.has(ctx.path) && body.image !== undefined;
  const setsLogo =
    (ctx.path === "/organization/create" && body.logo !== undefined) ||
    (ctx.path === "/organization/update" && body.data?.logo !== undefined);

  if (setsImage || setsLogo)
    throw APIError.fromStatus("BAD_REQUEST", {
      message: "Images can only be changed by uploading a file",
    });
});

const promoteToAdminIfConfigured = async (user: {
  id: string;
  email: string;
  emailVerified: boolean;
  role?: unknown;
}) => {
  try {
    const adminController = container.getAdminController();
    await adminController.promoteToAdminIfConfigured({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      role: typeof user.role === "string" ? user.role : null,
    });
  } catch (error) {
    logger.error("Error promoting user to admin", {
      error,
      userId: user.id,
    });
  }
};

const invalidateUserCache = async (userId: string) =>
  container
    .getCache()
    .delete(CacheKeys.user(userId), CacheKeys.userOrganizations(userId));

const invalidateUserOrganizations = async (userIds: string[]) =>
  container.getCache().delete(...userIds.map(CacheKeys.userOrganizations));

const invalidateOrganizationMembers = async (organizationId: string) => {
  try {
    const members = await db.member.findMany({
      where: { organizationId },
      select: { userId: true },
    });

    await invalidateUserOrganizations(members.map(({ userId }) => userId));
  } catch (error) {
    logger.error("Error invalidating organization members cache", {
      error,
      organizationId,
    });
  }
};

const isProduction = env.NODE_ENV === "production";

const serverUrl = getServerUrl();

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
  database: prismaAdapter(authDatabase, {
    provider: "postgresql",
  }),
  baseURL: serverUrl,
  disabledPaths: ["/token"],
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

          await promoteToAdminIfConfigured(user);

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
      update: {
        after: async (user, context) => {
          await invalidateUserCache(user.id);

          if (context?.path !== "/verify-email") return;

          await promoteToAdminIfConfigured(user);
        },
      },
      delete: {
        after: async (user) => {
          await invalidateUserCache(user.id);
        },
      },
    },
  },
  hooks: {
    before: rejectClientStorageKeys,
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

            You requested to change your email address to ${escapeMarkdown(newEmail)}.

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
    sendOnSignIn: true,
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
      ipAddressHeaders: [RESOLVED_CLIENT_IP_HEADER],
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
      requireEmailVerificationOnInvitation: true,
      organizationHooks: {
        afterCreateOrganization: async ({ user }) =>
          invalidateUserOrganizations([user.id]),
        afterUpdateOrganization: async ({ organization }) => {
          if (organization)
            await invalidateOrganizationMembers(organization.id);
        },
        beforeDeleteOrganization: async ({ organization }) =>
          invalidateOrganizationMembers(organization.id),
        afterAddMember: async ({ member }) =>
          invalidateUserOrganizations([member.userId]),
        afterRemoveMember: async ({ member }) =>
          invalidateUserOrganizations([member.userId]),
        afterAcceptInvitation: async ({ member }) =>
          invalidateUserOrganizations([member.userId]),
      },
      sendInvitationEmail: async (data) => {
        const inviteUrl = `${getServerUrl()}/auth/accept-invitation/${data.id}`;
        const inviterName = escapeMarkdown(data.inviter.user.name);
        const organizationName = escapeMarkdown(data.organization.name);

        await sendEmail({
          to: data.email,
          subject: `Invitation to join ${data.organization.name}`,
          preview: `${data.inviter.user.name} invited you to join ${data.organization.name}`,
          markdown: `
            Hello,

            ${inviterName} has invited you to join **${organizationName}**.

            [Accept Invitation](${inviteUrl})

            This invitation expires in 48 hours.
          `,
        });
      },
    }),
    admin(),
    twoFactor({
      issuer: SITE_CONFIG.TITLE,
      allowPasswordless: true,
      backupCodeOptions: { amount: 10 },
    }),
    passkey({
      rpID: new URL(serverUrl).hostname,
      rpName: SITE_CONFIG.TITLE,
      origin: serverUrl,
    }),
    lastLoginMethod(),
    jwt({ disableSettingJwtHeader: true }),
    mcp({
      loginPage: "/auth/signin",
      consentPage: "/auth/consent",
      resource: getMcpResourceUrl(),
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultApplicationType: "infer",
    }),
    cimd({
      fetchClientMetadataResource,
      metadataProfile: "mcp-2026-07-28",
    }),
    mcpSessionBridge(),
    tanstackStartCookies(),
  ],
});
