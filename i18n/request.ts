import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import Negotiator from "negotiator";

import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { match } from "@formatjs/intl-localematcher";

import { languageToLocale, type Locale, routing } from "./routing";

async function getMessages(locale: string) {
  try {
    return (await import(`../messages/${locale}.json`)).default;
  } catch {
    return (await import("../messages/en.json")).default;
  }
}

function getLocaleFromHeaders(headersList: Headers): Locale {
  const acceptLanguage = headersList.get("accept-language") ?? "";

  const negotiator = new Negotiator({
    headers: { "accept-language": acceptLanguage },
  });

  try {
    const matched = match(
      negotiator.languages(),
      routing.locales,
      routing.defaultLocale,
    );
    return matched as Locale;
  } catch {
    return routing.defaultLocale;
  }
}

export default getRequestConfig(async () => {
  let locale: Locale = routing.defaultLocale;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { language: true },
      });

      if (user?.language) {
        locale = languageToLocale(user.language);
      }
    } else {
      const headersList = await headers();
      locale = getLocaleFromHeaders(headersList);
    }
  } catch {
    const headersList = await headers();
    locale = getLocaleFromHeaders(headersList);
  }

  if (!hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    timeZone: "Europe/Paris",
    messages: await getMessages(locale),
  };
});
