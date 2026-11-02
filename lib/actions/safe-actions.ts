import { auth } from "@/lib/auth";
import { getServerRequestHeaders } from "@/lib/request";
import {
  type AccessFeature,
  type AccessLevel,
  hasAccess,
} from "@/shared/domain/access-control";
import { HttpError } from "@/shared/domain/errors/http.error";
import { container } from "@/shared/infrastructure/di/container";

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
