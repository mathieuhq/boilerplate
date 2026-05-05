"use client";

import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";
import type { ChangeEvent } from "react";
import { toast } from "sonner";

import {
  deleteFileAction,
  processAndUploadFileAction,
} from "@/actions/storage/storage.action";
import { updateUserAction } from "@/actions/user/user.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { getStorageFile, STORAGE_PREFIXES } from "@/lib/storage";
import { cn, getUserInitials } from "@/lib/utils";
import type { AuthUser } from "@/types/auth-user";
import { useMutation } from "@tanstack/react-query";

import { useImageFileInput } from "./use-image-file-input";

type AvatarFormProps = {
  user: AuthUser;
  onUploadSuccessAction?: (imageUrl: string) => void;
};

type UploadAvatarInput = {
  file: File;
  currentImage: string | null;
};

export const AvatarForm = ({
  user,
  onUploadSuccessAction,
}: AvatarFormProps) => {
  const t = useTranslations("settings.profile.avatar");

  const {
    accept,
    inputRef,
    resetInput,
    previewUrl,
    resetPreview,
    getValidFile,
    openFileDialog,
  } = useImageFileInput({
    onInvalidType: () => toast.error(t("invalidType")),
    onTooLarge: () => toast.error(t("tooLarge")),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ file, currentImage }: UploadAvatarInput) => {
      const uploadAction = processAndUploadFileAction.bind(null, file);

      const uploadResult = await uploadAction({
        prefix: STORAGE_PREFIXES.userAvatars,
        contentType: file.type,
      });

      const { key } = unwrapActionData(uploadResult).data;

      const updateResult = await updateUserAction({
        image: key,
      });

      unwrapActionData(updateResult);

      if (currentImage) void deleteFileAction({ key: currentImage });

      return key;
    },
    onSuccess: (key) => {
      toast.success(t("updated"));
      onUploadSuccessAction?.(key);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("uploadError"));
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

    mutate({ file, currentImage: user.image ?? null });
  };

  const displayImage = previewUrl ?? getStorageFile(user.image);

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
          <AvatarImage src={displayImage ?? undefined} alt={user.name} />
          <AvatarFallback className="text-lg">
            {getUserInitials(user.name, user.email)}
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
