const R2_DOMAIN_PATTERN = ".r2.cloudflarestorage.com";

export function getStorageFile(
  image: string | null | undefined,
): string | undefined {
  if (!image) return undefined;

  if (image.includes(R2_DOMAIN_PATTERN)) {
    try {
      const url = new URL(image);
      const key = url.pathname.slice(1);
      return `/api/storage/${key}`;
    } catch {
      return undefined;
    }
  }

  if (!image.startsWith("http")) return `/api/storage/${image}`;

  return image;
}
