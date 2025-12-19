import { defineRouting } from "next-intl/routing";

import type { Language } from "@/lib/generated/prisma/enums";

export const routing = defineRouting({
  defaultLocale: "en",
  locales: ["en", "fr"],
  localePrefix: "never",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export function languageToLocale(language: Language): Locale {
  return language.toLowerCase() as Locale;
}

export function localeToLanguage(locale: Locale): Language {
  return locale.toUpperCase() as Language;
}
