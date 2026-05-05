"use client";

import { useTranslations } from "next-intl";
import { Building2, Camera } from "lucide-react";
import type { ChangeEvent } from "react";
import { toast } from "sonner";

import { updateOrganizationAction } from "@/actions/organization/organization.action";
import {
  deleteFileAction,
  processAndUploadFileAction,
} from "@/actions/storage/storage.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { getStorageFile, STORAGE_PREFIXES } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

import { useImageFileInput } from "./use-image-file-input";

type OrganizationLogoFormProps = {
  organizationId: string;
  organizationName: string;
  currentLogo: string | null;
  onUploadSuccess?: (logoUrl: string | null) => void;
};

type UploadLogoInput = {
  file: File;
  currentLogo: string | null;
};

export const OrganizationLogoForm = ({
  currentLogo,
  organizationId,
  onUploadSuccess,
  organizationName,
}: OrganizationLogoFormProps) => {
  const t = useTranslations("organization");
  const tAvatar = useTranslations("settings.profile.avatar");

  const {
    accept,
    inputRef,
    previewUrl,
    resetInput,
    resetPreview,
    getValidFile,
    openFileDialog,
  } = useImageFileInput({
    onInvalidType: () => toast.error(tAvatar("invalidType")),
    onTooLarge: () => toast.error(tAvatar("tooLarge")),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ file, currentLogo: oldLogo }: UploadLogoInput) => {
      const uploadAction = processAndUploadFileAction.bind(null, file);

      const uploadResult = await uploadAction({
        prefix: STORAGE_PREFIXES.organizationAvatars,
        contentType: file.type,
      });

      const { key } = unwrapActionData(uploadResult).data;

      const updateResult = await updateOrganizationAction({
        organizationId,
        logo: key,
      });

      unwrapActionData(updateResult);

      if (oldLogo) void deleteFileAction({ key: oldLogo });

      return key;
    },
    onSuccess: (key) => {
      toast.success(t("updateSuccess"));
      onUploadSuccess?.(key);
    },
    onError: (error: Error) => {
      toast.error(error.message || tAvatar("uploadError"));
      resetPreview();
    },
    onSettled: () => resetInput(),
  });

  const handleClick = () => {
    if (!isPending) openFileDialog();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = getValidFile(event);
    if (!file) return;

    mutate({ file, currentLogo });
  };

  const displayImage = previewUrl ?? getStorageFile(currentLogo);

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className={cn(
          "group relative cursor-pointer rounded-full transition-opacity",
          isPending && "cursor-not-allowed opacity-70",
        )}
      >
        <Avatar className="size-24">
          <AvatarImage src={displayImage ?? undefined} alt={organizationName} />
          <AvatarFallback className="text-lg">
            <Building2 className="size-8" />
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity",
            !isPending && "group-hover:opacity-100",
            isPending && "opacity-100",
          )}
        >
          {isPending ? (
            <Loader className="size-6 text-white" />
          ) : (
            <Camera className="size-6 text-white" />
          )}
        </div>
      </button>
      <input
        type="file"
        ref={inputRef}
        accept={accept}
        className="hidden"
        disabled={isPending}
        onChange={handleFileChange}
      />
    </div>
  );
};
