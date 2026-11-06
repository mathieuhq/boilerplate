import { MAX_FILE_SIZE } from "@/lib/storage";

export const MAX_REQUEST_BODY_BYTES = MAX_FILE_SIZE + 2 * 1024 * 1024;

export function isRequestBodyTooLarge(request: Request) {
  return (
    Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST_BODY_BYTES
  );
}

export function createCspNonce() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString(
    "base64",
  );
}

export function getSecurityHeaders(
  nonce: string,
  production: boolean,
): Record<string, string> {
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(production ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  return {
    "Content-Security-Policy": contentSecurityPolicy,
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    ...(production
      ? { "Strict-Transport-Security": "max-age=31536000; includeSubDomains" }
      : {}),
  };
}
