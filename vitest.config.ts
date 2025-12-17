import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/__tests__/**/*.test.ts"],
    exclude: ["node_modules", ".next", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: [
        "src/features/**/domain/**/*.ts",
        "src/features/**/application/use-cases/**/*.ts",
        "src/shared/domain/**/*.ts",
        "src/shared/application/**/*.ts",
      ],
      exclude: ["**/__tests__/**", "**/*.d.ts", "**/index.ts", "**/*.types.ts"],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
