import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from "react";

import { getMessages, type Messages } from "./messages";
import { type Locale, routing } from "./routing";
import { createTranslator } from "./translator";

export type { Locale, Messages };

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
};

const I18nContext = createContext<I18nContextValue>({
  locale: routing.defaultLocale,
  messages: getMessages(routing.defaultLocale),
});

type I18nProviderProps = PropsWithChildren<{
  locale: Locale;
  messages: Messages;
}>;

export const I18nProvider = ({
  locale,
  children,
  messages,
}: I18nProviderProps) => {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useLocale() {
  return useContext(I18nContext).locale;
}

export function useMessages() {
  return useContext(I18nContext).messages;
}

export function useTranslations(namespace?: string) {
  const messages = useMessages();

  return useMemo(
    () => createTranslator(messages, namespace),
    [messages, namespace],
  );
}
