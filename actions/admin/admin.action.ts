"use server";

import {
  removeUserSchema,
  setUserPasswordSchema,
  setUserRoleSchema,
} from "@/features/admin/interface/schemas/admin.schema";
import { adminAction } from "@/lib/actions/safe-actions";
import { logger } from "@/lib/logger";
import { container } from "@/shared/infrastructure/di/container";
import { ActionResponse } from "@/shared/infrastructure/http";

export const removeUserAction = adminAction
  .inputSchema(removeUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    logger.info(`Admin ${ctx.user.id} removing user ${parsedInput.userId}`);

    const adminController = container.getAdminController();
    const result = await adminController.removeUser(
      parsedInput.userId,
      ctx.user.id,
    );

    return ActionResponse.success(result);
  });

export const setUserRoleAction = adminAction
  .inputSchema(setUserRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    const adminController = container.getAdminController();
    const result = await adminController.setUserRole(
      parsedInput.userId,
      parsedInput.role,
      ctx.user.id,
    );

    return ActionResponse.success(result);
  });

export const setUserPasswordAction = adminAction
  .inputSchema(setUserPasswordSchema)
  .action(async ({ parsedInput }) => {
    const adminController = container.getAdminController();
    const result = await adminController.setUserPassword(
      parsedInput.userId,
      parsedInput.newPassword,
    );

    return ActionResponse.success(result);
  });
