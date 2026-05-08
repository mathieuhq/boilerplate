import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";

const hasGlitchTipSourceMapConfig = Boolean(
  process.env.GLITCHTIP_AUTH_TOKEN &&
  process.env.GLITCHTIP_ORG &&
  process.env.GLITCHTIP_PROJECT,
);

export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    sourcemap: hasGlitchTipSourceMapConfig,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: "src",
      router: {
        semicolons: true,
        quoteStyle: "double",
        routesDirectory: "app",
      },
    }),
    ...sentryTanstackStart({
      silent: !process.env.CI,
      org: process.env.GLITCHTIP_ORG,
      sentryUrl: process.env.GLITCHTIP_URL,
      project: process.env.GLITCHTIP_PROJECT,
      authToken: process.env.GLITCHTIP_AUTH_TOKEN,
      sourcemaps: {
        disable: !hasGlitchTipSourceMapConfig,
      },
      telemetry: false,
    }),
    viteReact(),
    nitro(),
  ],
});
