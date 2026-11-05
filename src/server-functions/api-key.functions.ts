import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import type {
  ApiKeyListDTO,
  CreatedApiKeyDTO,
} from "@/features/auth/application/dto/api-key.dto";
import { toApiKeyActionError } from "@/features/auth/interface/errors/api-key-action-error.mapper";
import {
  createApiKeySchema,
  revokeApiKeySchema,
} from "@/features/auth/interface/schemas/api-key.schema";
import { getRequiredActionUser, userAction } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import type { ActionResponse as ActionResponseType } from "@/shared/infrastructure/http/api-response";

type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
type RevokeApiKeyInput = z.infer<typeof revokeApiKeySchema>;

export const getUserApiKeysData = createServerFn({ method: "GET" }).handler(
  async (): Promise<ApiKeyListDTO> => {
    await getRequiredActionUser();

    return container.getApiKeyController().listApiKeys();
  },
);

const createApiKeyServerFn = createServerFn({ method: "POST" })
  .validator(createApiKeySchema)
  .handler(async ({ data }) =>
    userAction(
      async () => container.getApiKeyController().createApiKey(data),
      toApiKeyActionError,
    ),
  );

const revokeApiKeyServerFn = createServerFn({ method: "POST" })
  .validator(revokeApiKeySchema)
  .handler(async ({ data }) =>
    userAction(
      async () => container.getApiKeyController().revokeApiKey(data),
      toApiKeyActionError,
    ),
  );

export async function createApiKeyAction(data: CreateApiKeyInput) {
  return createApiKeyServerFn({ data }) as Promise<
    ActionResponseType<CreatedApiKeyDTO>
  >;
}

export async function revokeApiKeyAction(data: RevokeApiKeyInput) {
  return revokeApiKeyServerFn({ data }) as Promise<
    ActionResponseType<{ revoked: true }>
  >;
}
