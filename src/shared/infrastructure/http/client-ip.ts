import { z } from "zod";

export const TRUSTED_IP_HEADERS = [
  "cf-connecting-ip",
  "x-real-ip",
  "x-forwarded-for",
] as const;

type TrustedIpHeader = (typeof TRUSTED_IP_HEADERS)[number];

export const RESOLVED_CLIENT_IP_HEADER = "x-resolved-client-ip";

const UNKNOWN_CLIENT_KEY = "unknown";
const IPV4_MAPPED_PREFIX = "::ffff:";

const ipv4Schema = z.ipv4();
const ipv6Schema = z.ipv6();

type ResolveClientIpOptions = {
  trustedHeader?: TrustedIpHeader;
  socketAddress?: string;
};

export function resolveClientIp(
  headers: Headers,
  options: ResolveClientIpOptions,
): string | null {
  if (!options.trustedHeader) return normalizeIp(options.socketAddress);

  const value = headers.get(options.trustedHeader);

  if (!value) return null;

  if (options.trustedHeader === "x-forwarded-for")
    return normalizeIp(value.split(",").at(-1));

  return normalizeIp(value);
}

export function getClientRateLimitKey(ip: string | null): string {
  if (!ip) return UNKNOWN_CLIENT_KEY;

  if (!ip.includes(":")) return ip;

  return `${expandIpv6(ip).slice(0, 4).join(":")}::/64`;
}

function normalizeIp(value?: string): string | null {
  const ip = value?.trim().toLowerCase();

  if (!ip) return null;

  if (ipv4Schema.safeParse(ip).success) return ip;

  if (ip.startsWith(IPV4_MAPPED_PREFIX)) {
    const mapped = ip.slice(IPV4_MAPPED_PREFIX.length);

    if (ipv4Schema.safeParse(mapped).success) return mapped;
  }

  return ipv6Schema.safeParse(ip).success ? ip : null;
}

function expandIpv6(ip: string): string[] {
  const [head, tail] = ip.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const missing = Math.max(8 - left.length - right.length, 0);

  return [...left, ...Array<string>(missing).fill("0"), ...right].map((group) =>
    group.padStart(4, "0"),
  );
}
