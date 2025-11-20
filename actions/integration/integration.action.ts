"use server";

import { integrationController } from "@/controllers/integration.controller";
import { authAction } from "@/lib/actions/safe-actions";
import { logger } from "@/lib/logger";
import {
  disconnectIntegrationSchema,
  saveHabitDashKeySchema,
} from "@/schemas/integration/integration.schema";

/**
 * Server action to save Habit Dash API key
 */
export const saveHabitDashKeyAction = authAction
  .inputSchema(saveHabitDashKeySchema)
  .action(async ({ parsedInput, ctx }) => {
    logger.info("[saveHabitDashKeyAction] Saving Habit Dash API key", {
      userId: ctx.user.id,
    });

    const result = await integrationController.saveHabitDashKey(
      ctx.user.id,
      parsedInput,
    );

    return result;
  });

/**
 * Server action to disconnect an integration
 */
export const disconnectIntegrationAction = authAction
  .inputSchema(disconnectIntegrationSchema)
  .action(async ({ parsedInput, ctx }) => {
    logger.info("[disconnectIntegrationAction] Disconnecting integration", {
      userId: ctx.user.id,
      provider: parsedInput.provider,
    });

    const result = await integrationController.disconnectIntegration(
      ctx.user.id,
      parsedInput,
    );

    return result;
  });
