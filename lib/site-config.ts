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

export type SiteConfig = typeof SITE_CONFIG;
