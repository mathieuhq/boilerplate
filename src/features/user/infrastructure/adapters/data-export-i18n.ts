import { getMessages } from "@/i18n/messages";
import { languageToLocale } from "@/i18n/routing";
import { createTranslator } from "@/i18n/translator";
import type { Language } from "@/lib/enums";

export function getDataExportTranslator(language: string, namespace: string) {
  const locale = languageToLocale(language as Language);

  return {
    t: createTranslator(getMessages(locale), namespace),
    formatDate: (date: Date) =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "long",
        timeZone: "UTC",
      }).format(date),
  };
}
