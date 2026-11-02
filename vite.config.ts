import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 3000,
    watch: {
      ignored: ["**/.output/**", "**/coverage/**"],
    },
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
    viteReact(),
    nitro({
      plugins: ["./src/jobs/worker.ts", "./lib/shutdown.ts"],
    }),
  ],
});
