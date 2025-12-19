import type { NextRequest } from "next/server";
import Negotiator from "negotiator";

import { type Locale, routing } from "@/i18n/routing";
import { match } from "@formatjs/intl-localematcher";

export { routing, type Locale } from "@/i18n/routing";
export {
  getPathname,
  Link,
  redirect,
  usePathname,
  useRouter,
} from "@/i18n/navigation";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

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

export function pathnameHasLocale(pathname: string): boolean {
  return routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)
      return locale;
  }

  return null;
}

export function getLocaleFromRequest(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;

  if (cookieLocale && routing.locales.includes(cookieLocale as Locale))
    return cookieLocale as Locale;

  const negotiator = new Negotiator({
    headers: {
      "accept-language": request.headers.get("accept-language") ?? "",
    },
  });

  const languages = negotiator.languages();

  try {
    return match(languages, routing.locales, routing.defaultLocale) as Locale;
  } catch {
    return routing.defaultLocale;
  }
}

export function getLocalizedPath(path: string, locale: Locale): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}
