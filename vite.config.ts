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
        routesDirectory: "app",
      },
    }),
    ...sentryTanstackStart({
      authToken: process.env.GLITCHTIP_AUTH_TOKEN,
      org: process.env.GLITCHTIP_ORG,
      project: process.env.GLITCHTIP_PROJECT,
      sentryUrl: process.env.GLITCHTIP_URL ?? "https://app.glitchtip.com",
      silent: !process.env.CI,
      sourcemaps: {
        disable: !hasGlitchTipSourceMapConfig,
      },
      telemetry: false,
    }),
    viteReact(),
    nitro(),
  ],
});
