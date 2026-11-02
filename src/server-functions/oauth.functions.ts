import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getRequiredActionUser } from "@/lib/actions/safe-actions";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getServerRequestHeaders } from "@/lib/request";

const getOAuthConsentDataSchema = z.object({
  clientId: z.string().min(1),
});

type OAuthConsentData = {
  clientName: string | null;
  clientUri: string | null;
  logoUri: string | null;
};

const getOAuthConsentDataServerFn = createServerFn({ method: "GET" })
  .validator(getOAuthConsentDataSchema)
  .handler(async ({ data }): Promise<OAuthConsentData> => {
    await getRequiredActionUser();

    try {
      const client = await auth.api.getOAuthClientPublic({
        query: { client_id: data.clientId },
        headers: getServerRequestHeaders(),
      });

      return {
        clientName: client.client_name ?? null,
        clientUri: client.client_uri ?? null,
        logoUri: client.logo_uri ?? null,
      };
    } catch (error) {
      logger.warn("Failed to load OAuth client", {
        error,
        clientId: data.clientId,
      });

      return { clientName: null, clientUri: null, logoUri: null };
    }
  });

export async function getOAuthConsentData(
  data: z.infer<typeof getOAuthConsentDataSchema>,
) {
  return getOAuthConsentDataServerFn({ data }) as Promise<OAuthConsentData>;
}
