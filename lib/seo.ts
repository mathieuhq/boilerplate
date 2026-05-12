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
  signup: {
    title: "Sign Up",
    description: `Create a new ${SITE_CONFIG.TITLE} account and get started today.`,
  },
  forgetPassword: {
    title: "Forgot Password",
    description: `Reset your ${SITE_CONFIG.TITLE} password to regain access to your account.`,
  },
  resetPassword: {
    title: "Reset Password",
    description: `Set a new password for your ${SITE_CONFIG.TITLE} account.`,
  },
  acceptInvitation: {
    title: "Accept Invitation",
    description: "Accept an invitation to join an organization.",
  },
  dashboard: {
    title: "Dashboard",
    description: `Manage your ${SITE_CONFIG.TITLE} account and view your activity.`,
  },
  settingsProfile: {
    title: "Profile Settings",
    description: "Update your profile information and preferences.",
  },
  settingsNotifications: {
    title: "Notification Settings",
    description: "Configure your email and notification preferences.",
  },
  changelog: {
    title: "Changelog",
    description: "Discover the latest updates and improvements.",
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
  settingsOrganization: {
    title: "Organization Settings",
    description: "Manage your organization settings and logo.",
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
