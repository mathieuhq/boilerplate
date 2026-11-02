import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import { toAdminActionError } from "@/features/admin/interface/errors/admin-action-error.mapper";
import { impersonateAdminUserSchema } from "@/features/admin/interface/schemas/admin.schema";
import {
  getRequiredActionAccess,
  getRequiredActionUser,
} from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import {
  ActionResponse,
  type ActionResponse as ActionResponseType,
} from "@/shared/infrastructure/http/api-response";

import { actionErrorResponse } from "./action-errors.server";

type ImpersonateUserInput = z.infer<typeof impersonateAdminUserSchema>;
type ImpersonateUserOutput = { expiresAt: string };
type StopImpersonationOutput = { impersonatedUserId: string };

function impersonationActionErrorResponse(error: unknown) {
  return actionErrorResponse(toAdminActionError(error));
}

const impersonateUserServerFn = createServerFn({ method: "POST" })
  .validator(impersonateAdminUserSchema)
  .handler(async ({ data }) => {
    try {
      const actor = await getRequiredActionAccess("impersonation", "write");
      const result = await container
        .getImpersonationController()
        .impersonateUser({
          userId: data.userId,
          actorUserId: actor.user.id,
          actorAccess: actor.access,
        });

      return ActionResponse.success(result);
    } catch (error) {
      return impersonationActionErrorResponse(error);
    }
  });

const stopImpersonationServerFn = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      await getRequiredActionUser();
      const result = await container
        .getImpersonationController()
        .stopImpersonation();

      return ActionResponse.success(result);
    } catch (error) {
      return impersonationActionErrorResponse(error);
    }
  },
);

export async function impersonateUserAction(data: ImpersonateUserInput) {
  return impersonateUserServerFn({ data }) as Promise<
    ActionResponseType<ImpersonateUserOutput>
  >;
}

export async function stopImpersonationAction() {
  return stopImpersonationServerFn() as Promise<
    ActionResponseType<StopImpersonationOutput>
  >;
}
