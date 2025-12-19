import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  defaultLocale: "en",
  locales: ["en", "fr"],
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
