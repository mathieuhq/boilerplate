export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const STORAGE_PREFIXES = {
  userAvatars: "user-avatars",
  organizationAvatars: "organization-avatars",
} as const;

const R2_DOMAIN_PATTERN = ".r2.cloudflarestorage.com";
const MANAGED_STORAGE_PREFIXES = new Set([
  "uploads",
  ...Object.values(STORAGE_PREFIXES),
]);

export function getExternalImageUrl(
  image: string | null | undefined,
): string | undefined {
  const value = image?.trim();

  if (!value) return undefined;

  if (isHttpUrl(value) && !isR2Url(value)) return value;

  return undefined;
}

export function getStorageObjectKey(
  image: string | null | undefined,
): string | undefined {
  const value = image?.trim();

  if (!value) return undefined;

  if (!isHttpUrl(value)) return normalizeStorageKey(value);

  if (!isR2Url(value)) return undefined;

  try {
    const url = new URL(value);
    return normalizeStorageKey(url.pathname.slice(1));
  } catch {
    return undefined;
  }
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function isR2Url(value: string) {
  return value.includes(R2_DOMAIN_PATTERN);
}

function normalizeStorageKey(value: string): string | undefined {
  const key = decodeStorageKey(value).replace(/^\/+/, "");

  if (!key || isHttpUrl(key)) return undefined;

  const segments = key.split("/").filter(Boolean);
  const managedPrefixIndex = segments.findIndex((segment) =>
    MANAGED_STORAGE_PREFIXES.has(segment),
  );

  if (managedPrefixIndex > 0) {
    return segments.slice(managedPrefixIndex).join("/");
  }

  return key;
}

function decodeStorageKey(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
