const API_PREFIX = "/api/v1/";

const UNLIMITED_API_PREFIXES = [
  "/api/v1/public/health",
  "/api/v1/private/auth/",
  "/api/v1/private/admin/jobs/",
] as const;

export function shouldRateLimitRequest(
  pathname: string,
  method: string,
  handlerType: "serverFn" | "router",
): boolean {
  if (handlerType === "serverFn") return method === "POST";

  if (!pathname.startsWith(API_PREFIX)) return false;

  return !UNLIMITED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
