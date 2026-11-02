import type { ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { cn, getUserInitials } from "@/lib/utils";
import { replaceUserAvatarAction } from "@/server-functions/storage.functions";
import type { AuthUser } from "@/types/auth-user";

import { useImageFileInput } from "./use-image-file-input";

type AvatarFormProps = {
  user: AuthUser;
  onUploadSuccessAction?: (imageKey: string) => void;
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
    mutationFn: async (file: File) => {
      const result = await replaceUserAvatarAction(file);

      const { key } = unwrapActionData(result);

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

    mutate(file);
  };

  const displayImage = previewUrl ?? user.imageUrl;

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        aria-label={t("change")}
        className={cn(
          "group relative cursor-pointer rounded-full transition-[opacity,scale] duration-150 outline-none select-none active:scale-[0.97] focus-visible:ring-[3px] focus-visible:ring-ring/50",
          isPending && "cursor-not-allowed opacity-70 active:scale-100",
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
            "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity duration-200",
            !isPending &&
              "group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100",
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
