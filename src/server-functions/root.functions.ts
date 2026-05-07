import { createServerFn } from "@tanstack/react-start";

import { getI18nData } from "@/i18n/server";

export const getRootI18n = createServerFn({ method: "GET" }).handler(
  async () => {
    return getI18nData();
  },
);
