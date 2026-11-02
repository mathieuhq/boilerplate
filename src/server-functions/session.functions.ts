import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import type { UserSessionListDTO } from "@/features/auth/application/dto/user-session.dto";
import { toSessionActionError } from "@/features/auth/interface/errors/session-action-error.mapper";
import { revokeUserSessionSchema } from "@/features/auth/interface/schemas/session.schema";
import { getRequiredActionUser } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import {
  ActionResponse,
  type ActionResponse as ActionResponseType,
} from "@/shared/infrastructure/http/api-response";

import { actionErrorResponse } from "./action-errors.server";

type RevokeUserSessionInput = z.infer<typeof revokeUserSessionSchema>;
type RevokeUserSessionOutput = { revoked: true };
type RevokeOtherUserSessionsOutput = { revokedCount: number };

function sessionActionErrorResponse(error: unknown) {
  return actionErrorResponse(toSessionActionError(error));
}

export const getUserSessionsData = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserSessionListDTO> => {
    await getRequiredActionUser();

    return container.getSessionController().listSessions();
  },
);

const revokeUserSessionServerFn = createServerFn({ method: "POST" })
  .validator(revokeUserSessionSchema)
  .handler(async ({ data }) => {
    try {
      await getRequiredActionUser();
      const result = await container.getSessionController().revokeSession(data);

      return ActionResponse.success(result);
    } catch (error) {
      return sessionActionErrorResponse(error);
    }
  });

const revokeOtherUserSessionsServerFn = createServerFn({
  method: "POST",
}).handler(async () => {
  try {
    await getRequiredActionUser();
    const result = await container.getSessionController().revokeOtherSessions();

    return ActionResponse.success(result);
  } catch (error) {
    return sessionActionErrorResponse(error);
  }
});

export async function revokeUserSessionAction(data: RevokeUserSessionInput) {
  return revokeUserSessionServerFn({ data }) as Promise<
    ActionResponseType<RevokeUserSessionOutput>
  >;
}

export async function revokeOtherUserSessionsAction() {
  return revokeOtherUserSessionsServerFn() as Promise<
    ActionResponseType<RevokeOtherUserSessionsOutput>
  >;
}
