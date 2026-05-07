import { createServerFn } from "@tanstack/react-start";

import { getChangelogs, getLatestVersion } from "@/lib/changelog";
import { getServerRequestHeaders } from "@/lib/request";
import { container } from "@/shared/infrastructure/di/container";

function getCookieValue(name: string) {
  const cookieHeader = getServerRequestHeaders().get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const cookie = cookies.find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

export const getDashboardLayoutData = createServerFn({
  method: "GET",
}).handler(async () => {
  const userController = container.getUserController();
  const organizationController = container.getOrganizationController();

  const [user, organizationState, isOrgAdmin] = await Promise.all([
    userController.getCurrentUser(),
    organizationController.resolveActiveOrganization(),
    organizationController.canManageCurrentUserOrganization(),
  ]);

  return {
    user,
    isOrgAdmin,
    latestVersion: getLatestVersion(),
    defaultOpen: getCookieValue("sidebar:state") !== "false",
    organizations: organizationState.organizations,
    activeOrganizationId: organizationState.activeOrganizationId,
  };
});

export const getSettingsLayoutData = createServerFn({
  method: "GET",
}).handler(async () => {
  const organizationController = container.getOrganizationController();
  const isOrgAdmin =
    await organizationController.canManageCurrentUserOrganization();

  return { isOrgAdmin };
});

export const getProfileSettingsData = createServerFn({
  method: "GET",
}).handler(async () => {
  const userController = container.getUserController();
  const user = await userController.getCurrentUserProfile();

  return { user };
});

export const getNotificationsSettingsData = createServerFn({
  method: "GET",
}).handler(async () => {
  const userController = container.getUserController();
  const user = await userController.getCurrentUserProfile();

  return { user };
});

export const getOrganizationSettingsData = createServerFn({
  method: "GET",
}).handler(async () => {
  const organizationController = container.getOrganizationController();
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

  return {
    members,
    invitations,
    organization,
  };
});

export const getAdminOverviewData = createServerFn({
  method: "GET",
}).handler(async () => {
  const adminController = container.getAdminController();
  const stats = await adminController.getRegistrationStats(30);

  return { stats };
});

export const getChangelogData = createServerFn({ method: "GET" }).handler(
  async () => {
    return {
      entries: getChangelogs(),
      latestVersion: getLatestVersion(),
    };
  },
);
