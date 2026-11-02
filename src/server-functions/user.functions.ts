import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import type { DataExportDTO } from "@/features/user/application/dto/data-export.dto";
import type { UserResponseDTO } from "@/features/user/application/dto/user-response.dto";
import { toDataExportActionError } from "@/features/user/interface/errors/data-export-error.mapper";
import {
  updateNotificationPreferencesSchema,
  updateUserProfileSchema,
} from "@/features/user/interface/schemas/user.schema";
import { getRequiredActionUser } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import {
  ActionResponse,
  type ActionResponse as ActionResponseType,
} from "@/shared/infrastructure/http/api-response";

import { actionErrorResponse } from "./action-errors.server";

type UpdateUserInput = z.infer<typeof updateUserProfileSchema>;
type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;

const updateUserServerFn = createServerFn({ method: "POST" })
  .validator(updateUserProfileSchema)
  .handler(async ({ data }) => {
    try {
      const user = await getRequiredActionUser();
      const userController = container.getUserController();
      const updatedUser = await userController.updateUserProfile(user.id, data);

      return ActionResponse.success(updatedUser);
    } catch (error) {
      return actionErrorResponse(error);
    }
  });

const updateNotificationPreferencesServerFn = createServerFn({
  method: "POST",
})
  .validator(updateNotificationPreferencesSchema)
  .handler(async ({ data }) => {
    try {
      const user = await getRequiredActionUser();
      const userController = container.getUserController();
      const updatedUser = await userController.updateNotificationPreferences(
        user.id,
        data,
      );

      return ActionResponse.success(updatedUser);
    } catch (error) {
      return actionErrorResponse(error);
    }
  });

const requestDataExportServerFn = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      const user = await getRequiredActionUser();
      const dataExport = await container
        .getDataExportController()
        .requestExport(user.id);

      return ActionResponse.success(dataExport);
    } catch (error) {
      return actionErrorResponse(toDataExportActionError(error));
    }
  },
);

export async function updateUserAction(data: UpdateUserInput) {
  return updateUserServerFn({ data }) as Promise<
    ActionResponseType<UserResponseDTO>
  >;
}

export async function updateNotificationPreferencesAction(
  data: UpdateNotificationPreferencesInput,
) {
  return updateNotificationPreferencesServerFn({ data }) as Promise<
    ActionResponseType<UserResponseDTO>
  >;
}

export async function requestDataExportAction() {
  return requestDataExportServerFn() as Promise<
    ActionResponseType<DataExportDTO>
  >;
}
