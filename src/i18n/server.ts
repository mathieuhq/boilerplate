import { getRequest } from "@tanstack/react-start/server";
import Negotiator from "negotiator";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { match } from "@formatjs/intl-localematcher";

import { getMessages } from "./messages";
import { isLocale, languageToLocale, type Locale, routing } from "./routing";
import { createTranslator } from "./translator";

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

    return isLocale(matched) ? matched : routing.defaultLocale;
  } catch {
    return routing.defaultLocale;
  }
}

async function resolveRequestLocale(): Promise<Locale> {
  const request = getRequest();
  const headers = request.headers;

  try {
    const session = await auth.api.getSession({ headers });

    if (!session?.user) return getLocaleFromHeaders(headers);

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { language: true },
    });

    return user ? languageToLocale(user.language) : routing.defaultLocale;
  } catch {
    return getLocaleFromHeaders(headers);
  }
}

export async function getI18nData() {
  const locale = await resolveRequestLocale();

  return {
    locale,
    messages: getMessages(locale),
  };
}

export async function getTranslations(namespace?: string) {
  const { messages } = await getI18nData();

  return createTranslator(messages, namespace);
}
