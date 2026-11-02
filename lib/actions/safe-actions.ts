import { auth } from "@/lib/auth";
import { getServerRequestHeaders } from "@/lib/request";
import { actionErrorResponse } from "@/server-functions/action-errors.server";
import {
  type AccessFeature,
  type AccessLevel,
  hasAccess,
} from "@/shared/domain/access-control";
import { HttpError } from "@/shared/domain/errors/http.error";
import { container } from "@/shared/infrastructure/di/container";
import {
  ActionResponse,
  type ActionResponse as ActionResponseType,
} from "@/shared/infrastructure/http/api-response";

type ActionUser = Awaited<ReturnType<typeof getRequiredActionUser>>;

type ActionActor = Awaited<ReturnType<typeof getRequiredActionAccess>>;

type ActionErrorMapper = (error: unknown) => unknown;

export async function getRequiredActionUser() {
  const session = await auth.api.getSession({
    headers: getServerRequestHeaders(),
  });

  if (!session?.user) throw HttpError.unauthorized();

  return session.user;
}

export async function getRequiredActionAccess(
  feature: AccessFeature,
  level: AccessLevel,
) {
  const user = await getRequiredActionUser();
  const access = await container.getAdminController().resolveAccess(user.role);

  if (!hasAccess(access, feature, level))
    throw HttpError.forbidden("Missing access to this feature");

  return { user, access };
}

async function runAction<Actor, Data>(
  authorize: () => Promise<Actor>,
  run: (actor: Actor) => Promise<Data>,
  mapError?: ActionErrorMapper,
): Promise<ActionResponseType<Data>> {
  try {
    const actor = await authorize();

    return ActionResponse.success(await run(actor));
  } catch (error) {
    return actionErrorResponse(mapError ? mapError(error) : error);
  }
}

export async function userAction<Data>(
  run: (user: ActionUser) => Promise<Data>,
  mapError?: ActionErrorMapper,
) {
  return runAction(getRequiredActionUser, run, mapError);
}

export async function accessAction<Data>(
  feature: AccessFeature,
  level: AccessLevel,
  run: (actor: ActionActor) => Promise<Data>,
  mapError?: ActionErrorMapper,
) {
  return runAction(
    async () => getRequiredActionAccess(feature, level),
    run,
    mapError,
  );
}
