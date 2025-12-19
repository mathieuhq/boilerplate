import type { Metadata } from "next";

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
      "A modern full-stack Next.js boilerplate with authentication, payments, and email integration.",
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
  dashboard: {
    title: "Dashboard",
    description: `Manage your ${SITE_CONFIG.TITLE} account and view your activity.`,
  },
  settingsProfile: {
    title: "Profile Settings",
    description: "Update your profile information and preferences.",
  },
  settingsBilling: {
    title: "Billing Settings",
    description: "Manage your subscription and payment methods.",
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
};

export function getPageMetadata(pageKey: keyof typeof SEO_CONFIG): Metadata {
  const page = SEO_CONFIG[pageKey];

  return {
    title: page.title,
    description: page.description,
  };
}
