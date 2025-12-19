import { type Locale, routing } from "@/i18n/routing";

export {
  routing,
  type Locale,
  languageToLocale,
  localeToLanguage,
} from "@/i18n/routing";
export {
  getPathname,
  Link,
  redirect,
  usePathname,
  useRouter,
} from "@/i18n/navigation";

export function isValidLocale(locale: unknown): locale is Locale {
  return (
    typeof locale === "string" && routing.locales.includes(locale as Locale)
  );
}

export function getLocaleDisplayName(locale: Locale): string {
  const displayNames: Record<Locale, string> = {
    en: "English",
    fr: "Français",
  };

  return displayNames[locale];
}

export function getLocaleFlag(locale: Locale): string {
  const flags: Record<Locale, string> = {
    en: "🇺🇸",
    fr: "🇫🇷",
  };

  return flags[locale];
}
