"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";

import { acceptOrganizationInvitationAction } from "@/actions/organization/organization.action";
import { LoadingButton } from "@/components/features/form/form-button";
import {
  getActionErrorMessage,
  isActionSuccessful,
} from "@/lib/actions/actions-utils";
import { useMutation } from "@tanstack/react-query";

type AcceptInvitationFormProps = {
  invitationId: string;
};

export const AcceptInvitationForm = ({
  invitationId,
}: AcceptInvitationFormProps) => {
  const router = useRouter();
  const t = useTranslations("auth");

  const acceptInvitation = useMutation({
    mutationFn: async () => {
      const result = await acceptOrganizationInvitationAction({
        invitationId,
      });

      if (!isActionSuccessful(result))
        throw new Error(getActionErrorMessage(result));

      return result.data;
    },
    onSuccess: () => {
      toast.success(t("invitationAcceptedSuccess"));
      router.push("/settings/organization");
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || t("invitationAcceptedError"));
    },
  });

  return (
    <LoadingButton
      type="button"
      className="w-full"
      loading={acceptInvitation.isPending}
      onClick={() => acceptInvitation.mutate()}
    >
      <MailCheck className="size-4" />
      {t("acceptInvitation")}
    </LoadingButton>
  );
};
