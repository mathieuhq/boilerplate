import {
  type AccessFeature,
  type AccessGrants,
  type AccessLevel,
  hasAccess,
} from "@/shared/domain/access-control";
import { HttpError } from "@/shared/domain/errors/http.error";

export function assertAccess(
  access: AccessGrants,
  feature: AccessFeature,
  level: AccessLevel,
) {
  if (!hasAccess(access, feature, level))
    throw HttpError.forbidden("Missing access to this feature");
}
