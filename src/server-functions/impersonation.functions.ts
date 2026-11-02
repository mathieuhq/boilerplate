import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import { toAdminActionError } from "@/features/admin/interface/errors/admin-action-error.mapper";
import { impersonateAdminUserSchema } from "@/features/admin/interface/schemas/admin.schema";
import { accessAction, userAction } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import type { ActionResponse as ActionResponseType } from "@/shared/infrastructure/http/api-response";

type ImpersonateUserInput = z.infer<typeof impersonateAdminUserSchema>;
type ImpersonateUserOutput = { expiresAt: string };
type StopImpersonationOutput = { impersonatedUserId: string };

const impersonateUserServerFn = createServerFn({ method: "POST" })
  .validator(impersonateAdminUserSchema)
  .handler(async ({ data }) =>
    accessAction(
      "impersonation",
      "write",
      async (actor) =>
        container.getImpersonationController().impersonateUser({
          userId: data.userId,
          actorUserId: actor.user.id,
          actorAccess: actor.access,
        }),
      toAdminActionError,
    ),
  );

const stopImpersonationServerFn = createServerFn({ method: "POST" }).handler(
  async () =>
    userAction(
      async () => container.getImpersonationController().stopImpersonation(),
      toAdminActionError,
    ),
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
