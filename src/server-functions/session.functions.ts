import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import type { UserSessionListDTO } from "@/features/auth/application/dto/user-session.dto";
import { toSessionActionError } from "@/features/auth/interface/errors/session-action-error.mapper";
import { revokeUserSessionSchema } from "@/features/auth/interface/schemas/session.schema";
import { getRequiredActionUser, userAction } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import type { ActionResponse as ActionResponseType } from "@/shared/infrastructure/http/api-response";

type RevokeUserSessionInput = z.infer<typeof revokeUserSessionSchema>;
type RevokeUserSessionOutput = { revoked: true };
type RevokeOtherUserSessionsOutput = { revokedCount: number };

export const getUserSessionsData = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserSessionListDTO> => {
    await getRequiredActionUser();

    return container.getSessionController().listSessions();
  },
);

const revokeUserSessionServerFn = createServerFn({ method: "POST" })
  .validator(revokeUserSessionSchema)
  .handler(async ({ data }) =>
    userAction(
      async () => container.getSessionController().revokeSession(data),
      toSessionActionError,
    ),
  );

const revokeOtherUserSessionsServerFn = createServerFn({
  method: "POST",
}).handler(async () =>
  userAction(
    async () => container.getSessionController().revokeOtherSessions(),
    toSessionActionError,
  ),
);

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
