"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/storage";

type UseImageFileInputOptions = {
  onInvalidType?: () => void;
  onTooLarge?: () => void;
};

const acceptedImageTypes = ACCEPTED_IMAGE_TYPES.join(",");

export function useImageFileInput({
  onTooLarge,
  onInvalidType,
}: UseImageFileInputOptions = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const resetInput = useCallback(() => {
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const revokePreviewUrl = useCallback(() => {
    if (!previewUrlRef.current) return;

    URL.revokeObjectURL(previewUrlRef.current);

    previewUrlRef.current = null;
  }, []);

  const resetPreview = useCallback(() => {
    revokePreviewUrl();
    setPreviewUrl(null);
  }, [revokePreviewUrl]);

  const setFilePreview = useCallback(
    (file: File) => {
      revokePreviewUrl();

      const nextPreviewUrl = URL.createObjectURL(file);

      previewUrlRef.current = nextPreviewUrl;

      setPreviewUrl(nextPreviewUrl);
    },
    [revokePreviewUrl],
  );

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const getValidFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) return null;

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        resetInput();
        onInvalidType?.();
        return null;
      }

      if (file.size > MAX_FILE_SIZE) {
        resetInput();
        onTooLarge?.();
        return null;
      }

      setFilePreview(file);

      return file;
    },
    [onInvalidType, onTooLarge, resetInput, setFilePreview],
  );

  useEffect(() => revokePreviewUrl, [revokePreviewUrl]);

  return {
    inputRef,
    previewUrl,
    resetInput,
    resetPreview,
    getValidFile,
    openFileDialog,
    accept: acceptedImageTypes,
  };
}
