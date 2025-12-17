"use server";

import {
  removeUserSchema,
  setUserPasswordSchema,
  setUserRoleSchema,
} from "@/features/admin/interface/schemas/admin.schema";
import { adminAction } from "@/lib/actions/safe-actions";
import { logger } from "@/lib/logger";
import { container } from "@/shared/infrastructure/di/container";

/**
 * Server action to remove a user (admin only)
 */
export const removeUserAction = adminAction
  .inputSchema(removeUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    logger.info(`Admin ${ctx.user.id} removing user ${parsedInput.userId}`);

    const adminController = container.getAdminController();
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
    const adminController = container.getAdminController();
    const result = await adminController.setUserRole(
      parsedInput.userId,
      parsedInput.role,
      ctx.user.id,
    );

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
    const adminController = container.getAdminController();
    const result = await adminController.setUserPassword(
      parsedInput.userId,
      parsedInput.newPassword,
    );

    return {
      success: true,
      user: result,
    };
  });
