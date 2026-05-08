import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { LoadingButton } from "@/components/features/form/form-button";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { useRouter } from "@/lib/navigation";
import { acceptOrganizationInvitationAction } from "@/server-functions/organization.functions";

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

      return unwrapActionData(result);
    },
    onSuccess: () => {
      toast.success(t("invitationAcceptedSuccess"));
      router.replace("/");
      router.refresh();
    },
    onError: (error: Error) =>
      toast.error(error.message || t("invitationAcceptedError")),
  });

  return (
    <LoadingButton
      type="button"
      className="w-full"
      loading={acceptInvitation.isPending}
      onClick={() => acceptInvitation.mutate()}
    >
      {t("acceptInvitation")}
    </LoadingButton>
  );
};
