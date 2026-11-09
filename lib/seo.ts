import { SITE_CONFIG } from "@/lib/site-config";

type PageSEO = {
  title: string;
  description: string;
};

type SEOConfig = Record<string, PageSEO>;

export const SEO_CONFIG: SEOConfig = {
  home: {
    title: SITE_CONFIG.TITLE,
    description:
      "A modern full-stack TanStack Start boilerplate with authentication, payments, and email integration.",
  },
  signin: {
    title: "Sign In",
    description: `Sign in to your ${SITE_CONFIG.TITLE} account to access your dashboard.`,
  },
  acceptInvitation: {
    title: "Accept Invitation",
    description: "Accept an invitation to join an organization.",
  },
  oauthConsent: {
    title: "Authorize Application",
    description: `Allow an application to access your ${SITE_CONFIG.TITLE} account.`,
  },
  dashboard: {
    title: "Dashboard",
    description: `Manage your ${SITE_CONFIG.TITLE} account and view your activity.`,
  },
  settingsProfile: {
    title: "Profile Settings",
    description: "Update your profile information and preferences.",
  },
  settingsSecurity: {
    title: "Security Settings",
    description: "Manage passkeys and active sessions.",
  },
  settingsApiKeys: {
    title: "API Keys",
    description: "Create and revoke API keys for the public API.",
  },
  settingsBilling: {
    title: "Billing Settings",
    description: "Manage your organization's plan and payment details.",
  },
  settingsNotifications: {
    title: "Notification Settings",
    description: "Configure your email and notification preferences.",
  },
  mcp: {
    title: "MCP Server",
    description: `Connect AI assistants to your ${SITE_CONFIG.TITLE} account with MCP.`,
  },
  changelog: {
    title: "Changelog",
    description: "Discover the latest updates and improvements.",
  },
  terms: {
    title: "Terms of Service",
    description: `The terms that govern your use of ${SITE_CONFIG.TITLE}.`,
  },
  privacy: {
    title: "Privacy Policy",
    description: `How ${SITE_CONFIG.TITLE} collects, uses and protects your data.`,
  },
  adminOverview: {
    title: "Admin Overview",
    description: "View registration statistics and platform metrics.",
  },
  adminUsers: {
    title: "Admin Users",
    description: "Manage platform users, roles, and access status.",
  },
  adminOrganizations: {
    title: "Admin Organizations",
    description: "Review organizations, members, and invitations.",
  },
  adminAuditLogs: {
    title: "Admin Audit Logs",
    description: "Review sensitive administrative activity.",
  },
  adminRoles: {
    title: "Admin Roles",
    description: "Create roles and choose what each one can do.",
  },
  settingsOrganization: {
    title: "Organization Settings",
    description: "Manage your organization settings and logo.",
  },
  settingsOrganizationActivity: {
    title: "Organization Activity",
    description: "Review recent activity in your organization.",
  },
};

type PageMetadata = {
  title: string;
  description: string;
};

function getPageMetadata(pageKey: keyof typeof SEO_CONFIG): PageMetadata {
  const page = SEO_CONFIG[pageKey];

  return {
    title: page.title,
    description: page.description,
  };
}

export function getPageMetaTags(pageKey: keyof typeof SEO_CONFIG) {
  const metadata = getPageMetadata(pageKey);

  return [
    { title: metadata.title },
    { name: "description", content: metadata.description },
  ];
}
