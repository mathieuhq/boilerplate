"use server";

import { adminController } from "@/controllers/admin.controller";
import { adminAction } from "@/lib/actions/safe-actions";
import { logger } from "@/lib/logger";
import {
  removeUserSchema,
  setUserPasswordSchema,
  setUserRoleSchema,
} from "@/schemas/admin/admin.schema";

/**
 * Server action to remove a user (admin only)
 */
export const removeUserAction = adminAction
  .inputSchema(removeUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    logger.info(`Admin ${ctx.user.id} removing user ${parsedInput.userId}`);

    const result = await adminController.removeUser(
      parsedInput.userId,
      ctx.user.id,
    );

    return {
      success: true,
      user: result,
    };
  });

/**
 * Server action to set a user's role (admin only)
 */
export const setUserRoleAction = adminAction
  .inputSchema(setUserRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await adminController.setUserRole(parsedInput, ctx.user.id);

    return {
      success: true,
      user: result,
    };
  });

/**
 * Server action to set a user's password (admin only)
 */
export const setUserPasswordAction = adminAction
  .inputSchema(setUserPasswordSchema)
  .action(async ({ parsedInput }) => {
    const result = await adminController.setUserPassword(parsedInput);

    return {
      success: true,
      user: result,
    };
  });
