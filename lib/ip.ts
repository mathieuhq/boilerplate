const IP_V4_REGEX =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/;
const IP_V6_REGEX = /^[\da-fA-F:]+$/;

function isValidIp(ip: string): boolean {
  const trimmed = ip.trim();
  return IP_V4_REGEX.test(trimmed) || IP_V6_REGEX.test(trimmed);
}

function extractFirstValidIp(headerValue: string | null): string | null {
  if (!headerValue) return null;

  const ips = headerValue.split(",");

  for (const ip of ips) {
    const trimmed = ip.trim();

    if (isValidIp(trimmed)) return trimmed;
  }

  return null;
}

function hashCode(str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(36);
}

export function getIp(request: Request): string {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (cfConnectingIp && isValidIp(cfConnectingIp)) return cfConnectingIp.trim();

  const xRealIp = request.headers.get("x-real-ip");

  if (xRealIp && isValidIp(xRealIp)) return xRealIp.trim();

  const xForwardedFor = extractFirstValidIp(
    request.headers.get("x-forwarded-for"),
  );

  if (xForwardedFor) return xForwardedFor;

  const requestIp = (request as Request & { ip?: string }).ip;

  if (requestIp && isValidIp(requestIp)) return requestIp.trim();

  return `anonymous-${hashCode(request.url)}`;
}
