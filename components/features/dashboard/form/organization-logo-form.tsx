"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, Camera } from "lucide-react";
import { toast } from "sonner";

import { updateOrganizationAction } from "@/actions/organization/organization.action";
import {
  deleteFileAction,
  processAndUploadFileAction,
} from "@/actions/storage/storage.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import {
  getActionErrorMessage,
  isActionSuccessful,
} from "@/lib/actions/actions-utils";
import {
  ACCEPTED_IMAGE_TYPES,
  getStorageFile,
  MAX_FILE_SIZE,
  STORAGE_PREFIXES,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

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
  organizationId,
  organizationName,
  currentLogo,
  onUploadSuccess,
}: OrganizationLogoFormProps) => {
  const t = useTranslations("organization");
  const tAvatar = useTranslations("settings.profile.avatar");
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ file, currentLogo: oldLogo }: UploadLogoInput) => {
      const uploadAction = processAndUploadFileAction.bind(null, file);

      const uploadResult = await uploadAction({
        prefix: STORAGE_PREFIXES.organizationAvatars,
        contentType: file.type,
      });

      if (!isActionSuccessful(uploadResult))
        throw new Error(getActionErrorMessage(uploadResult));

      const { key } = uploadResult.data.data;

      const updateResult = await updateOrganizationAction({
        organizationId,
        logo: key,
      });

      if (!isActionSuccessful(updateResult))
        throw new Error(getActionErrorMessage(updateResult));

      if (oldLogo) void deleteFileAction({ key: oldLogo });

      return key;
    },
    onSuccess: (key) => {
      toast.success(t("updateSuccess"));
      onUploadSuccess?.(key);
    },
    onError: (error: Error) => {
      toast.error(error.message || tAvatar("uploadError"));
      setPreviewUrl(null);
    },
    onSettled: () => inputRef.current && (inputRef.current.value = ""),
  });

  const handleClick = () => !isPending && inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type))
      return toast.error(tAvatar("invalidType"));

    if (file.size > MAX_FILE_SIZE) return toast.error(tAvatar("tooLarge"));

    setPreviewUrl(URL.createObjectURL(file));

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
        className="hidden"
        onChange={handleFileChange}
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
      />
    </div>
  );
};
