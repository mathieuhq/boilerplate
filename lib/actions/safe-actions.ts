import { auth } from "@/lib/auth";
import { ActionError } from "@/lib/errors/action-error";
import { getServerRequestHeaders } from "@/lib/request";
import {
  type AccessFeature,
  type AccessLevel,
  hasAccess,
} from "@/shared/domain/access-control";
import { container } from "@/shared/infrastructure/di/container";

export async function getRequiredActionUser() {
  const session = await auth.api.getSession({
    headers: getServerRequestHeaders(),
  });

  if (!session?.user) throw ActionError.unauthorized();

  return session.user;
}

export async function getRequiredActionAccess(
  feature: AccessFeature,
  level: AccessLevel,
) {
  const user = await getRequiredActionUser();
  const access = await container.getAdminController().resolveAccess(user.role);

  if (!hasAccess(access, feature, level))
    throw ActionError.forbidden("Missing access to this feature");

  return { user, access };
}
