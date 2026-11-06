import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import {
  admin,
  jwt,
  lastLoginMethod,
  organization,
  twoFactor,
} from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { createHash } from "node:crypto";
import { render } from "react-email";

import { MarkdownEmail } from "@/components/features/email/email-markdown";
import { IMPERSONATION_SESSION_DURATION_SECONDS } from "@/features/admin/domain/impersonation";
import {
  escapeMarkdown,
  escapeMarkdownUrl,
} from "@/features/email/application/services/escape-markdown";
import { authDatabase } from "@/lib/auth-database";
import {
  assertInvitationCanBeAccepted,
  assertOrganizationWithinLimit,
  assertOrganizationCanAddMembers,
  createBillingPlugin,
  hasReachedOrganizationLimit,
  syncTeamSeats,
} from "@/lib/billing";
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
import { container } from "@/shared/infrastructure/di/container";
import { RESOLVED_CLIENT_IP_HEADER } from "@/shared/infrastructure/http/client-ip";
import { apiKey } from "@better-auth/api-key";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { mcp } from "@better-auth/mcp";
import { passkey } from "@better-auth/passkey";

import { impersonation } from "./impersonation";
import { getMcpResourceUrl } from "./mcp/resource";
import { mcpSessionBridge } from "./mcp/session-bridge";
import { organizationActivityLog } from "./organization-activity-log";
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
    disableIdTokenSignIn: true,
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

type AuthHookContext = Parameters<
  Parameters<typeof createAuthMiddleware>[0]
>[0];

const rejectClientStorageKeys = (ctx: AuthHookContext) => {
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
};

const IMPERSONATION_FORBIDDEN_PREFIXES = [
  "/passkey/",
  "/oauth2/",
  "/two-factor/",
  "/subscription/",
  "/change-email",
];

const TWO_FACTOR_SETTINGS_PATHS = new Set([
  "/two-factor/enable",
  "/two-factor/disable",
  "/two-factor/generate-backup-codes",
]);

const TWO_FACTOR_FRESH_SESSION_MS = 10 * 60 * 1000;

const hasCredentialPassword = async (userId: string) =>
  (await db.account.count({
    where: { userId, providerId: "credential", password: { not: null } },
  })) > 0;

const guardSensitiveRoutes = async (ctx: AuthHookContext) => {
  const changesTwoFactor = TWO_FACTOR_SETTINGS_PATHS.has(ctx.path);
  const forbiddenWhileImpersonating = IMPERSONATION_FORBIDDEN_PREFIXES.some(
    (prefix) => ctx.path.startsWith(prefix),
  );

  if (!changesTwoFactor && !forbiddenWhileImpersonating) return;

  const current = await getSessionFromCtx(ctx);

  if (!current) return;

  const session = current.session as typeof current.session & {
    impersonatedBy?: string | null;
  };

  if (session.impersonatedBy)
    throw APIError.fromStatus("FORBIDDEN", {
      message: "This action is not available while impersonating a user",
    });

  if (!changesTwoFactor) return;

  const sessionAge = Date.now() - new Date(session.createdAt).getTime();

  if (
    sessionAge > TWO_FACTOR_FRESH_SESSION_MS &&
    !(await hasCredentialPassword(current.user.id))
  )
    throw APIError.fromStatus("FORBIDDEN", {
      message: "Sign in again to change your two-factor settings",
    });

  if (ctx.path !== "/two-factor/generate-backup-codes")
    await revokeTrustedDevices(current.user.id);
};

const authBeforeHook = createAuthMiddleware(async (ctx) => {
  if (!ctx.request) return;

  rejectClientStorageKeys(ctx);
  await guardSensitiveRoutes(ctx);
});

const deleteUserVerifications = async (
  userId: string,
  prefix: string,
  keepIdentifier?: string,
) => {
  const { internalAdapter } = await auth.$context;
  const verifications = await db.verification.findMany({
    where: { value: userId, identifier: { startsWith: prefix } },
    select: { identifier: true },
  });

  await Promise.all(
    verifications
      .filter(({ identifier }) => identifier !== keepIdentifier)
      .map(async ({ identifier }) =>
        internalAdapter.deleteVerificationByIdentifier(identifier),
      ),
  );
};

const revokeTrustedDevices = async (userId: string) =>
  deleteUserVerifications(userId, "trust-device-");

const revokeDelegatedAccess = async (userId: string) => {
  const revoked = new Date();

  await db.$transaction([
    db.oauthRefreshToken.updateMany({
      where: { userId, revoked: null },
      data: { revoked },
    }),
    db.oauthAccessToken.updateMany({
      where: { userId, revoked: null },
      data: { revoked },
    }),
    db.oauthConsent.deleteMany({ where: { userId } }),
  ]);
};

const SOCIAL_SIGN_IN_PATHS = ["/callback/", "/sign-in/social", "/link-social"];

const isSocialSignIn = (path?: string) =>
  !!path && SOCIAL_SIGN_IN_PATHS.some((prefix) => path.startsWith(prefix));

const clampImpersonationSession = async (session: {
  token: string;
  createdAt: Date;
  expiresAt: Date;
  impersonatedBy?: string | null;
}) => {
  if (!session.impersonatedBy) return;

  const limit = new Date(
    new Date(session.createdAt).getTime() +
      IMPERSONATION_SESSION_DURATION_SECONDS * 1000,
  );

  if (new Date(session.expiresAt) <= limit) return;

  const { internalAdapter } = await auth.$context;
  await internalAdapter.updateSession(session.token, { expiresAt: limit });
};

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

const serverHostname = new URL(serverUrl).hostname;

const isLocalDevelopment =
  !isProduction &&
  (["localhost", "127.0.0.1", "[::1]"].includes(serverHostname) ||
    serverHostname.endsWith(".localhost"));

const RECIPIENT_EMAIL_LIMIT = 10;

const RECIPIENT_EMAIL_WINDOW_SECONDS = 60 * 60;

const hasReachedRecipientEmailLimit = async (to: string) => {
  if (!secondaryStorage) return false;

  const recipient = createHash("sha256")
    .update(to.trim().toLowerCase())
    .digest("hex");

  const sent = await secondaryStorage.increment(
    `${SITE_CONFIG.APP_ID}:email-recipient:${recipient}`,
    RECIPIENT_EMAIL_WINDOW_SECONDS,
  );

  return sent > RECIPIENT_EMAIL_LIMIT;
};

const subscribeToEmailAudience = async (user: {
  id: string;
  name: string;
  email: string;
}) => {
  try {
    const result = await container.getEmailController().subscribeContact({
      name: user.name,
      email: user.email,
    });

    if (!result.success || !result.contactId) {
      logger.warn("Failed to subscribe user to email audience", {
        userId: user.id,
      });
      return;
    }

    await db.user.update({
      where: { id: user.id },
      data: { emailContactId: result.contactId },
    });
    await invalidateUserCache(user.id);

    logger.info("User subscribed to email audience", {
      userId: user.id,
      emailContactId: result.contactId,
    });
  } catch (error) {
    logger.error("Error subscribing user to email audience", {
      error,
      userId: user.id,
    });
  }
};

const syncEmailAudienceAfterVerification = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      emailContactId: true,
      marketingEmails: true,
    },
  });

  if (!user) return;

  if (user.emailContactId && !user.emailVerified) {
    try {
      await container.getEmailController().deleteContact(user.emailContactId);
      await db.user.update({
        where: { id: user.id },
        data: { emailContactId: null },
      });
      await invalidateUserCache(user.id);
    } catch (error) {
      logger.error("Error removing previous email audience contact", {
        error,
        userId: user.id,
      });
    }
    return;
  }

  if (!user.emailContactId && user.emailVerified && user.marketingEmails)
    await subscribeToEmailAudience(user);
};

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

  if (await hasReachedRecipientEmailLimit(params.to)) {
    logger.warn("Email dropped: recipient limit reached", {
      subject: params.subject,
    });
    return;
  }

  const emailController = container.getEmailController();

  await emailController.queueEmail({
    html,
    to: params.to,
    subject: params.subject,
  });
};

const DISABLED_AUTH_PATHS = [
  "/token",
  "/account-info",
  "/get-access-token",
  "/refresh-token",
  "/list-accounts",
  "/list-sessions",
  "/revoke-session",
  "/revoke-sessions",
  "/revoke-other-sessions",
  "/update-session",
  "/update-user",
  "/change-password",
  "/verify-password",
  "/delete-user",
  "/delete-user/callback",
  "/link-social",
  "/unlink-account",
  "/two-factor/get-totp-uri",
  "/two-factor/send-otp",
  "/two-factor/verify-otp",
  "/passkey/update-passkey",
  ...[
    "ban-user",
    "create-user",
    "get-user",
    "has-permission",
    "impersonate-user",
    "list-user-sessions",
    "list-users",
    "remove-user",
    "revoke-user-session",
    "revoke-user-sessions",
    "set-role",
    "set-user-password",
    "stop-impersonating",
    "unban-user",
    "update-user",
  ].map((path) => `/admin/${path}`),
  ...[
    "accept-invitation",
    "add-team-member",
    "cancel-invitation",
    "check-slug",
    "create",
    "create-role",
    "create-team",
    "delete",
    "delete-role",
    "get-active-member",
    "get-active-member-role",
    "get-full-organization",
    "get-invitation",
    "get-organization",
    "get-role",
    "has-permission",
    "invite-member",
    "leave",
    "list",
    "list-invitations",
    "list-members",
    "list-roles",
    "list-team-members",
    "list-teams",
    "list-user-invitations",
    "list-user-teams",
    "reject-invitation",
    "remove-member",
    "remove-team",
    "remove-team-member",
    "set-active",
    "set-active-team",
    "update",
    "update-member-role",
    "update-role",
    "update-team",
  ].map((path) => `/organization/${path}`),
  ...["create", "get", "list", "update", "delete"].map(
    (path) => `/api-key/${path}`,
  ),
];

export const auth = betterAuth({
  database: prismaAdapter(authDatabase, {
    provider: "postgresql",
  }),
  baseURL: serverUrl,
  basePath: "/api/v1/private/auth",
  disabledPaths: DISABLED_AUTH_PATHS,
  trustedOrigins: getTrustedOrigins(),
  secondaryStorage,
  rateLimit: {
    max: 100,
    window: 60,
    enabled: !isLocalDevelopment,
    storage: secondaryStorage ? "secondary-storage" : "memory",
  },
  verification: {
    storeInDatabase: true,
  },
  account: {
    encryptOAuthTokens: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 20,
    updateAge: 60 * 60 * 24 * 7,
    storeSessionInDatabase: true,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          if (isSocialSignIn(context?.path) && !user.emailVerified)
            throw APIError.fromStatus("FORBIDDEN", {
              message: "Verify your email address with your provider first",
            });

          return isLocalDevelopment
            ? { data: { ...user, emailVerified: true } }
            : { data: user };
        },
        after: async (user) => {
          if (user.emailVerified) await subscribeToEmailAudience(user);

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

            await container.getOrganizationActivityController().record({
              action: "organization.created",
              actorUserId: user.id,
              organizationId: organization.id,
              resourceType: "organization",
              resourceId: organization.id,
              metadata: { name: organization.name, slug: organization.slug },
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

          await syncEmailAudienceAfterVerification(user.id);
          await promoteToAdminIfConfigured(user);
        },
      },
      delete: {
        after: async (user) => {
          await invalidateUserCache(user.id);
        },
      },
    },
    session: {
      update: {
        after: async (session) => clampImpersonationSession(session),
      },
    },
  },
  hooks: {
    before: authBeforeHook,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    requireEmailVerification: !isLocalDevelopment,
    onPasswordReset: async ({ user }) => {
      await Promise.all([
        revokeTrustedDevices(user.id),
        revokeDelegatedAccess(user.id),
        deleteUserVerifications(user.id, "reset-password:"),
      ]);
    },
    async sendResetPassword({ user, url, token }) {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        preview: `Reset your password for ${SITE_CONFIG.TITLE}`,
        markdown: `
          Hello,

          You requested to reset your password.

          [Click here to reset your password](${escapeMarkdownUrl(url)})
          `,
      });

      await deleteUserVerifications(
        user.id,
        "reset-password:",
        `reset-password:${token}`,
      );
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

            [Click here to approve this change](${escapeMarkdownUrl(url)})
            `,
        });
      },
    },
  },
  emailVerification: {
    sendOnSignUp: !isLocalDevelopment,
    sendOnSignIn: !isLocalDevelopment,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        preview: `Verify your email for ${SITE_CONFIG.TITLE}`,
        markdown: `
          Hello,

          Welcome to ${SITE_CONFIG.TITLE}! Please verify your email address.

          [Click here to verify your email](${escapeMarkdownUrl(url)})
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
      organizationLimit: hasReachedOrganizationLimit,
      membershipLimit: 100,
      invitationExpiresIn: 60 * 60 * 48,
      allowUserToCreateOrganization: true,
      requireEmailVerificationOnInvitation: true,
      organizationHooks: {
        afterCreateOrganization: async ({ organization, user }) => {
          await assertOrganizationWithinLimit(user, organization.id);
          await invalidateUserOrganizations([user.id]);
        },
        afterUpdateOrganization: async ({ organization }) => {
          if (organization)
            await invalidateOrganizationMembers(organization.id);
        },
        beforeDeleteOrganization: async ({ organization }) =>
          invalidateOrganizationMembers(organization.id),
        beforeCreateInvitation: async ({ organization, inviter }) =>
          assertOrganizationCanAddMembers(organization.id, inviter),
        beforeAcceptInvitation: async ({ invitation }) =>
          assertInvitationCanBeAccepted(invitation),
        afterAddMember: async ({ member }) => {
          await invalidateUserOrganizations([member.userId]);
          await syncTeamSeats(member.organizationId);
        },
        afterRemoveMember: async ({ member }) => {
          await invalidateUserOrganizations([member.userId]);
          await syncTeamSeats(member.organizationId);
        },
        afterAcceptInvitation: async ({ member }) => {
          await invalidateUserOrganizations([member.userId]);
          await syncTeamSeats(member.organizationId);
        },
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
    admin({
      impersonationSessionDuration: IMPERSONATION_SESSION_DURATION_SECONDS,
    }),
    impersonation(),
    organizationActivityLog(),
    twoFactor({
      issuer: SITE_CONFIG.TITLE,
      allowPasswordless: true,
      backupCodeOptions: { amount: 10 },
    }),
    passkey({
      rpID: new URL(serverUrl).hostname,
      rpName: SITE_CONFIG.TITLE,
      origin: serverUrl,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
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
    apiKey({
      rateLimit: {
        enabled: !isLocalDevelopment,
        timeWindow: 60_000,
        maxRequests: 100,
      },
    }),
    createBillingPlugin(),
    tanstackStartCookies(),
  ],
});
