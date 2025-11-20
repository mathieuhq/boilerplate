import { z } from "zod";

/**
 * Supported integration providers
 */
export const INTEGRATION_PROVIDERS = {
  HABIT_DASH: "HabitDash",
} as const;

export type IntegrationProvider =
  (typeof INTEGRATION_PROVIDERS)[keyof typeof INTEGRATION_PROVIDERS];

/**
 * Validates saving a Habit Dash API key
 */
export const saveHabitDashKeySchema = z.object({
  apiKey: z
    .string()
    .min(1, "API key is required")
    .max(500, "API key is too long"),
});

/**
 * Validates disconnecting an integration
 */
export const disconnectIntegrationSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
});

/**
 * TypeScript types inferred from schemas
 */
export type SaveHabitDashKeyInput = z.infer<typeof saveHabitDashKeySchema>;
export type DisconnectIntegrationInput = z.infer<
  typeof disconnectIntegrationSchema
>;
