import { createServerFn } from "@tanstack/react-start";

import type { ProcessAndUploadFileOutputDTO } from "@/features/storage/application/dto/presigned-url.dto";
import { processAndUploadFileSchema } from "@/features/storage/interface/schemas/storage.schema";
import { getRequiredActionUser } from "@/lib/actions/safe-actions";
import { logger } from "@/lib/logger";
import { getStorageObjectKey, STORAGE_PREFIXES } from "@/lib/storage";
import { HttpError } from "@/shared/domain/errors/http.error";
import { container } from "@/shared/infrastructure/di/container";
import {
  ActionResponse,
  type ActionResponse as ActionResponseType,
} from "@/shared/infrastructure/http/api-response";

import { actionErrorResponse } from "./action-errors.server";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type ImageUploadInput = {
  file: File;
  contentType: string;
  prefix: (typeof STORAGE_PREFIXES)[keyof typeof STORAGE_PREFIXES];
};

type ReplaceOrganizationLogoInput = ImageUploadInput & {
  organizationId: string;
};

type ReplaceImageOutput = ProcessAndUploadFileOutputDTO;

function getRequiredFormDataFile(data: unknown) {
  if (!(data instanceof FormData))
    throw HttpError.validationError("Expected FormData");

  const file = data.get("file");

  if (!(file instanceof File))
    throw HttpError.validationError("A file is required");

  if (file.size > MAX_FILE_SIZE_BYTES)
    throw HttpError.validationError("File size cannot exceed 10 MB");

  return { data, file };
}

function parseImageUploadInput(
  data: unknown,
  prefix: ImageUploadInput["prefix"],
): ImageUploadInput {
  const { file } = getRequiredFormDataFile(data);

  const parsedInput = processAndUploadFileSchema.parse({
    prefix,
    contentType: file.type,
  });

  return {
    file,
    prefix,
    contentType: parsedInput.contentType,
  };
}

function parseOrganizationLogoUploadInput(
  data: unknown,
): ReplaceOrganizationLogoInput {
  const { data: formData } = getRequiredFormDataFile(data);
  const input = parseImageUploadInput(
    data,
    STORAGE_PREFIXES.organizationAvatars,
  );
  const organizationId = formData.get("organizationId")?.toString();

  if (!organizationId)
    throw HttpError.validationError("Organization id is required");

  return {
    ...input,
    organizationId,
  };
}

async function processImageUpload(input: ImageUploadInput) {
  const storageController = container.getStorageController();
  const arrayBuffer = await input.file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return storageController.processAndUploadFile({
    buffer,
    prefix: input.prefix,
    contentType: input.contentType,
  });
}

async function deleteStorageObjectIfManaged(
  image: string | null | undefined,
  prefix: ImageUploadInput["prefix"],
) {
  const key = getStorageObjectKey(image);

  if (!key?.startsWith(`${prefix}/`)) return;

  try {
    const storageController = container.getStorageController();
    await storageController.deleteFile(key);
  } catch (error) {
    logger.warn("Failed to delete replaced storage object", { error, key });
  }
}

const replaceUserAvatarServerFn = createServerFn({ method: "POST" })
  .validator((data) =>
    parseImageUploadInput(data, STORAGE_PREFIXES.userAvatars),
  )
  .handler(async ({ data }) => {
    try {
      const user = await getRequiredActionUser();
      const userController = container.getUserController();
      const currentUser = await userController.getCurrentUserProfile();
      const uploaded = await processImageUpload(data);

      try {
        await userController.updateUserProfile(user.id, {
          image: uploaded.key,
        });
      } catch (error) {
        await deleteStorageObjectIfManaged(uploaded.key, data.prefix);
        throw error;
      }

      await deleteStorageObjectIfManaged(currentUser.image, data.prefix);

      return ActionResponse.success(uploaded);
    } catch (error) {
      return actionErrorResponse(error);
    }
  });

const replaceOrganizationLogoServerFn = createServerFn({ method: "POST" })
  .validator(parseOrganizationLogoUploadInput)
  .handler(async ({ data }) => {
    try {
      const user = await getRequiredActionUser();
      const organizationController = container.getOrganizationController();
      const organizations =
        await organizationController.listCurrentUserOrganizations();
      const organization = organizations.find(
        (candidate) => candidate.id === data.organizationId,
      );

      if (!organization)
        throw HttpError.forbidden("Organization access required");

      const members = await organizationController.listMembers({
        organizationId: organization.id,
      });
      const currentMember = members.find((member) => member.userId === user.id);

      if (currentMember?.role !== "owner" && currentMember?.role !== "admin")
        throw HttpError.forbidden("Organization admin access required");

      const uploaded = await processImageUpload(data);

      try {
        await organizationController.updateOrganization({
          organizationId: data.organizationId,
          logo: uploaded.key,
        });
      } catch (error) {
        await deleteStorageObjectIfManaged(uploaded.key, data.prefix);
        throw error;
      }

      await deleteStorageObjectIfManaged(organization.logo, data.prefix);

      return ActionResponse.success(uploaded);
    } catch (error) {
      return actionErrorResponse(error);
    }
  });

export async function replaceUserAvatarAction(file: File) {
  const formData = new FormData();

  formData.set("file", file);

  return replaceUserAvatarServerFn({ data: formData }) as Promise<
    ActionResponseType<ReplaceImageOutput>
  >;
}

export async function replaceOrganizationLogoAction(
  file: File,
  data: { organizationId: string },
) {
  const formData = new FormData();

  formData.set("file", file);
  formData.set("organizationId", data.organizationId);

  return replaceOrganizationLogoServerFn({ data: formData }) as Promise<
    ActionResponseType<ReplaceImageOutput>
  >;
}
