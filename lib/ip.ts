import { getRequestIP } from "@tanstack/react-start/server";

import { env } from "@/lib/env";
import {
  resolveClientIp,
  RESOLVED_CLIENT_IP_HEADER,
} from "@/shared/infrastructure/http/client-ip";

export function getClientIp(request: Request): string | null {
  return resolveClientIp(request.headers, {
    trustedHeader: env.TRUSTED_IP_HEADER,
    socketAddress: getRequestIP(),
  });
}

export function withResolvedClientIp(request: Request): Request {
  const headers = new Headers(request.headers);

  const ip = getClientIp(request);

  headers.delete(RESOLVED_CLIENT_IP_HEADER);

  if (ip) headers.set(RESOLVED_CLIENT_IP_HEADER, ip);

  return new Request(request.url, {
    headers,
    duplex: "half",
    body: request.body,
    method: request.method,
    signal: request.signal,
  } as RequestInit);
}
