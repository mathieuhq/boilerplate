import { getTranslations } from "next-intl/server";

import { AcceptInvitationForm } from "@/components/features/auth/accept-invitation-form";
import { AuthTemplate } from "@/components/features/auth/auth-template";

type AcceptInvitationViewProps = {
  invitationId: string;
};

export async function AcceptInvitationView({
  invitationId,
}: AcceptInvitationViewProps) {
  const t = await getTranslations("auth");

  return (
    <AuthTemplate
      title={t("acceptInvitationTitle")}
      description={t("acceptInvitationDescription")}
      form={<AcceptInvitationForm invitationId={invitationId} />}
    />
  );
}
