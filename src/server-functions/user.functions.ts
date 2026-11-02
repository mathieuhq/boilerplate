import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import type { DataExportDTO } from "@/features/user/application/dto/data-export.dto";
import type { UserResponseDTO } from "@/features/user/application/dto/user-response.dto";
import { toDataExportActionError } from "@/features/user/interface/errors/data-export-error.mapper";
import {
  updateNotificationPreferencesSchema,
  updateUserProfileSchema,
} from "@/features/user/interface/schemas/user.schema";
import { userAction } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import type { ActionResponse as ActionResponseType } from "@/shared/infrastructure/http/api-response";

type UpdateUserInput = z.infer<typeof updateUserProfileSchema>;
type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;

const updateUserServerFn = createServerFn({ method: "POST" })
  .validator(updateUserProfileSchema)
  .handler(async ({ data }) =>
    userAction(async (user) =>
      container.getUserController().updateUserProfile(user.id, data),
    ),
  );

const updateNotificationPreferencesServerFn = createServerFn({
  method: "POST",
})
  .validator(updateNotificationPreferencesSchema)
  .handler(async ({ data }) =>
    userAction(async (user) =>
      container
        .getUserController()
        .updateNotificationPreferences(user.id, data),
    ),
  );

const requestDataExportServerFn = createServerFn({ method: "POST" }).handler(
  async () =>
    userAction(
      async (user) =>
        container.getDataExportController().requestExport(user.id),
      toDataExportActionError,
    ),
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
