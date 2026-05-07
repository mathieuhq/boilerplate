import type { Language } from "@/lib/generated/prisma/enums";

export const routing = {
  defaultLocale: "en",
  locales: ["en", "fr"],
} as const;

export type Locale = (typeof routing.locales)[number];

export function isLocale(value: string | undefined): value is Locale {
  return routing.locales.includes(value as Locale);
}

export function languageToLocale(language: Language): Locale {
  const locale = language.toLowerCase();

  return isLocale(locale) ? locale : routing.defaultLocale;
}

export function localeToLanguage(locale: Locale): Language {
  return locale.toUpperCase() as Language;
}
