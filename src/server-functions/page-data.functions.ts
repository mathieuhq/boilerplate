import { createServerFn } from "@tanstack/react-start";

import { resolveStorageImageUrl } from "@/features/storage/application/services/storage-image-url-resolver";
import { getRequiredActionUser } from "@/lib/actions/safe-actions";
import { auth } from "@/lib/auth";
import { getChangelogs, getLatestVersion } from "@/lib/changelog";
import { logger } from "@/lib/logger";
import { getMcpResourceUrl } from "@/lib/mcp/resource";
import { getServerRequestHeaders } from "@/lib/request";
import { container } from "@/shared/infrastructure/di/container";

function getCookieValue(name: string) {
  const cookieHeader = getServerRequestHeaders().get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const cookie = cookies.find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function createStorageImageResolver() {
  const storageController = container.getStorageController();

  return async (image: string | null | undefined) =>
    resolveStorageImageUrl(
      image,
      storageController.generateDownloadUrl.bind(storageController),
      {
        onError: (error, key) => {
          logger.warn("Failed to resolve storage image URL", { error, key });
        },
      },
    );
}

export const getDashboardLayoutData = createServerFn({
  method: "GET",
}).handler(async () => {
  await getRequiredActionUser();

  const userController = container.getUserController();
  const organizationController = container.getOrganizationController();

  const resolveImageUrl = createStorageImageResolver();

  const [user, organizationState] = await Promise.all([
    userController.getCurrentUser(),
    organizationController.resolveActiveOrganization(),
  ]);

  const [userImageUrl, organizations] = await Promise.all([
    resolveImageUrl(user.image),
    Promise.all(
      organizationState.organizations.map(async (organization) => ({
        ...organization,
        logoUrl: await resolveImageUrl(organization.logo),
      })),
    ),
  ]);

  return {
    user: {
      ...user,
      imageUrl: userImageUrl,
    },
    organizations,
    latestVersion: getLatestVersion(),
    defaultOpen: getCookieValue("sidebar:state") !== "false",
    activeOrganizationId: organizationState.activeOrganizationId,
  };
});

export const getSettingsLayoutData = createServerFn({
  method: "GET",
}).handler(async () => {
  await getRequiredActionUser();

  const organizationController = container.getOrganizationController();
  const isOrgAdmin =
    await organizationController.canManageCurrentUserOrganization();

  return { isOrgAdmin };
});

export const getProfileSettingsData = createServerFn({
  method: "GET",
}).handler(async () => {
  await getRequiredActionUser();

  const userController = container.getUserController();
  const resolveImageUrl = createStorageImageResolver();
  const user = await userController.getCurrentUserProfile();
  const dataExport = await container
    .getDataExportController()
    .getStatus(user.id);

  return {
    user: {
      ...user,
      imageUrl: await resolveImageUrl(user.image),
    },
    dataExport,
  };
});

export const getNotificationsSettingsData = createServerFn({
  method: "GET",
}).handler(async () => {
  await getRequiredActionUser();

  const userController = container.getUserController();
  const user = await userController.getCurrentUserProfile();

  return { user };
});

export const getSecuritySettingsData = createServerFn({
  method: "GET",
}).handler(async () => {
  const user = await getRequiredActionUser();

  const accounts = await auth.api.listUserAccounts({
    headers: getServerRequestHeaders(),
  });

  return {
    email: user.email,
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    hasPassword: accounts.some(
      (account) => account.providerId === "credential",
    ),
  };
});

export const getOrganizationSettingsData = createServerFn({
  method: "GET",
}).handler(async () => {
  await getRequiredActionUser();

  const organizationController = container.getOrganizationController();
  const resolveImageUrl = createStorageImageResolver();
  const organization =
    await organizationController.getCurrentUserOrganization();

  const [members, invitations] = await Promise.all([
    organizationController.listMembers({
      organizationId: organization.id,
    }),
    organizationController.listInvitations({
      organizationId: organization.id,
    }),
  ]);

  const [logoUrl, membersWithImageUrls] = await Promise.all([
    resolveImageUrl(organization.logo),
    Promise.all(
      members.map(async (member) => ({
        ...member,
        user: {
          ...member.user,
          imageUrl: await resolveImageUrl(member.user.image),
        },
      })),
    ),
  ]);

  return {
    members: membersWithImageUrls,
    invitations,
    organization: {
      ...organization,
      logoUrl,
    },
  };
});

export const getChangelogData = createServerFn({ method: "GET" }).handler(
  async () => {
    return {
      entries: getChangelogs(),
      latestVersion: getLatestVersion(),
    };
  },
);

export const getMcpPageData = createServerFn({
  method: "GET",
}).handler(async () => {
  await getRequiredActionUser();

  return { mcpUrl: getMcpResourceUrl() };
});
