import type { Messages } from "./messages";

type TranslationValues = Partial<
  Record<string, string | number | boolean | null>
>;

export type TranslationFn = (key: string, values?: TranslationValues) => string;

function resolveMessage(messages: Messages, path: string) {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object") return undefined;

    return (value as Record<string, unknown>)[segment];
  }, messages);
}

function interpolate(message: string, values?: TranslationValues) {
  if (!values) return message;

  return message.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];

    return value === undefined || value === null ? match : String(value);
  });
}

export function createTranslator(
  messages: Messages,
  namespace?: string,
): TranslationFn {
  return (key, values) => {
    const path = namespace ? `${namespace}.${key}` : key;
    const message = resolveMessage(messages, path);

    if (typeof message !== "string") return path;

    return interpolate(message, values);
  };
}
