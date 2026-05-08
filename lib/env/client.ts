import { z } from "zod";

import { createEnv } from "@t3-oss/env-core";

export const clientEnv = createEnv({
  client: {
    VITE_UMAMI_URL: z.url().optional(),
    VITE_GLITCHTIP_DSN: z.url().optional(),
    VITE_UMAMI_WEBSITE_ID: z.string().optional(),
  },
  clientPrefix: "VITE_",
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
