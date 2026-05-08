import { getExternalImageUrl, getStorageObjectKey } from "@/lib/storage";

type GenerateDownloadUrl = (key: string) => Promise<{ downloadUrl: string }>;

type ResolveStorageImageUrlOptions = {
  onError?: (error: unknown, key: string) => void;
};

export async function resolveStorageImageUrl(
  image: string | null | undefined,
  generateDownloadUrl: GenerateDownloadUrl,
  options: ResolveStorageImageUrlOptions = {},
): Promise<string | undefined> {
  const externalUrl = getExternalImageUrl(image);

  if (externalUrl) return externalUrl;

  const key = getStorageObjectKey(image);

  if (!key) return undefined;

  try {
    const { downloadUrl } = await generateDownloadUrl(key);

    return downloadUrl;
  } catch (error) {
    options.onError?.(error, key);

    return undefined;
  }
}
