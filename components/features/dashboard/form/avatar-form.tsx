"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";

import {
  deleteFileAction,
  processAndUploadFileAction,
} from "@/actions/storage/storage.action";
import { updateUserAction } from "@/actions/user/user.action";
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
} from "@/lib/storage";
import { cn, getUserInitials } from "@/lib/utils";
import type { AuthUser } from "@/types/auth-user";
import { useMutation } from "@tanstack/react-query";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ file, currentImage }: UploadAvatarInput) => {
      const uploadAction = processAndUploadFileAction.bind(null, file);

      const uploadResult = await uploadAction({
        prefix: "avatars",
        contentType: file.type,
      });

      if (!isActionSuccessful(uploadResult))
        throw new Error(getActionErrorMessage(uploadResult));

      const { key } = uploadResult.data.data;

      const updateResult = await updateUserAction({
        image: key,
      });

      if (!isActionSuccessful(updateResult))
        throw new Error(getActionErrorMessage(updateResult));

      if (currentImage) void deleteFileAction({ key: currentImage });

      return key;
    },
    onSuccess: (key) => {
      toast.success("Profile picture updated!");
      onUploadSuccessAction?.(key);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload image");
      setPreviewUrl(null);
    },
    onSettled: () => inputRef.current && (inputRef.current.value = ""),
  });

  const handleClick = () => !isPending && inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type))
      return toast.error(
        "Please select a valid image (JPEG, PNG, GIF, or WebP)",
      );

    if (file.size > MAX_FILE_SIZE)
      return toast.error("Image must be less than 10MB");

    setPreviewUrl(URL.createObjectURL(file));

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
        className="hidden"
        onChange={handleFileChange}
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
      />
    </div>
  );
};
