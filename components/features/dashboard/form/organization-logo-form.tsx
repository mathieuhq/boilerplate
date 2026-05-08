import { useMutation } from "@tanstack/react-query";
import { Building2, Camera } from "lucide-react";
import type { ChangeEvent } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { cn } from "@/lib/utils";
import { replaceOrganizationLogoAction } from "@/server-functions/storage.functions";

import { useImageFileInput } from "./use-image-file-input";

type OrganizationLogoFormProps = {
  organizationId: string;
  organizationName: string;
  currentLogoUrl?: string | null;
  onUploadSuccessAction?: (logoKey: string) => void;
};

type UploadLogoInput = {
  file: File;
};

export const OrganizationLogoForm = ({
  currentLogoUrl,
  organizationId,
  organizationName,
  onUploadSuccessAction,
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
    mutationFn: async ({ file }: UploadLogoInput) => {
      const result = await replaceOrganizationLogoAction(file, {
        organizationId,
      });

      const { key } = unwrapActionData(result);

      return key;
    },
    onSuccess: (key) => {
      toast.success(t("updateSuccess"));
      onUploadSuccessAction?.(key);
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

    mutate({ file });
  };

  const displayImage = previewUrl ?? currentLogoUrl;

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
