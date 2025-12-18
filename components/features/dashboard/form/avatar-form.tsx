"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";

import {
  deleteFileAction,
  generateUploadUrlAction,
} from "@/actions/storage/storage.action";
import { updateUserAction } from "@/actions/user/user.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import {
  getActionErrorMessage,
  isActionSuccessful,
} from "@/lib/actions/actions-utils";
import { getStorageFile } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth-user";

type AvatarFormProps = {
  user: AuthUser;
  onUploadSuccess?: (imageUrl: string) => void;
};

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const AvatarForm = ({ user, onUploadSuccess }: AvatarFormProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!isUploading) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please select a valid image (JPEG, PNG, GIF, or WebP)");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const uploadUrlResult = await generateUploadUrlAction({
        prefix: "avatars",
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
      });

      if (!isActionSuccessful(uploadUrlResult)) {
        throw new Error(getActionErrorMessage(uploadUrlResult));
      }

      const { uploadUrl, key } = uploadUrlResult.data.data;

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const updateResult = await updateUserAction({
        image: key,
      });

      if (!isActionSuccessful(updateResult)) {
        throw new Error(getActionErrorMessage(updateResult));
      }

      if (user.image) {
        void deleteFileAction({ key: user.image });
      }

      toast.success("Profile picture updated!");
      onUploadSuccess?.(key);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
      );
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayImage = previewUrl ?? getStorageFile(user.image);

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className={cn(
          "group relative cursor-pointer rounded-full transition-opacity",
          isUploading && "cursor-not-allowed opacity-70",
        )}
      >
        <Avatar className="size-24">
          <AvatarImage src={displayImage ?? undefined} alt={user.name} />
          <AvatarFallback className="text-lg">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity",
            !isUploading && "group-hover:opacity-100",
            isUploading && "opacity-100",
          )}
        >
          {isUploading ? (
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
