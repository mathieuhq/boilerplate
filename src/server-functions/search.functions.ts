import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import type { SearchResponseDTO } from "@/features/search/application/dto/search.dto";
import { globalSearchSchema } from "@/features/search/interface/schemas/search.schema";
import { isLocale, routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { ratelimit } from "@/lib/rate-limit";
import { getServerRequestHeaders } from "@/lib/request";
import { HttpError } from "@/shared/domain/errors/http.error";
import { container } from "@/shared/infrastructure/di/container";
import {
  ActionResponse,
  type ActionResponse as ActionResponseType,
} from "@/shared/infrastructure/http/api-response";
import { HttpStatus } from "@/shared/infrastructure/http/http-status";

import { actionErrorResponse } from "./action-errors.server";

type GlobalSearchInput = z.infer<typeof globalSearchSchema>;

function toSearchLocale(language: string | null | undefined) {
  const locale = language?.toLowerCase();

  return isLocale(locale) ? locale : routing.defaultLocale;
}

const globalSearchServerFn = createServerFn({ method: "GET" })
  .validator(globalSearchSchema)
  .handler(async ({ data }) => {
    try {
      const session = await auth.api.getSession({
        headers: getServerRequestHeaders(),
      });

      if (!session?.user) throw HttpError.unauthorized();

      const { success } = await ratelimit.limit(`search:${session.user.id}`);

      if (!success)
        throw new HttpError(
          "RATE_LIMITED",
          "Too many search requests",
          HttpStatus.TOO_MANY_REQUESTS,
        );

      const access = await container
        .getAdminController()
        .resolveAccess(session.user.role);

      const result = await container.getSearchController().search({
        query: data.query,
        userId: session.user.id,
        locale: toSearchLocale(session.user.language),
        access,
        activeOrganizationId: session.session.activeOrganizationId ?? null,
      });

      return ActionResponse.success(result);
    } catch (error) {
      return actionErrorResponse(error);
    }
  });

export async function globalSearchAction(data: GlobalSearchInput) {
  return globalSearchServerFn({ data }) as Promise<
    ActionResponseType<SearchResponseDTO>
  >;
}
