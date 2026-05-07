import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["node_modules", ".output", "dist"],
    include: ["src/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "json", "html"],
      include: [
        "src/shared/domain/**/*.ts",
        "src/features/**/domain/**/*.ts",
        "src/shared/application/**/*.ts",
        "src/features/**/application/use-cases/**/*.ts",
      ],
      exclude: [
        "**/*.d.ts",
        "**/index.ts",
        "**/*.dto.ts",
        "**/*.port.ts",
        "**/*.types.ts",
        "**/__tests__/**",
        "**/*.interface.ts",
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
