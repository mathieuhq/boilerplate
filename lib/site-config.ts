export const SITE_CONFIG = {
  APP_ID: "boilerplate",
  TITLE: "Boilerplate",
  LANGUAGE: "en-US",
  LOGO: "/next.svg",
  SERVER: {
    PROD_URL: "https://boilerplate.com",
  },
  MAKER: {
    NAME: "Mathieu Dacheux",
  },
  SEO: {
    DESCRIPTION:
      "A modern full-stack Next.js boilerplate with authentication, payments, and email integration.",
    KEYWORDS: [
      "Next.js",
      "React",
      "TypeScript",
      "Boilerplate",
      "SaaS",
      "Authentication",
      "Stripe",
      "Prisma",
    ],
  },
  SOCIAL: {
    X: {
      HANDLE: "@mathieudacheux",
      URL: "https://x.com/mathieudacheux",
    },
    LINKEDIN: {
      URL: "https://linkedin.com/in/mathieudacheux",
    },
    INSTAGRAM: {
      HANDLE: "@mathieudacheux",
      URL: "https://instagram.com/mathieudacheux",
    },
  },
} as const;
