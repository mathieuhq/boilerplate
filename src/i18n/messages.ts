import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

import type { Locale } from "./routing";

export type Messages = typeof en;

const messagesByLocale: Record<Locale, Messages> = {
  en,
  fr,
};

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale];
}
