import { AcceptInvitationForm } from "@/components/features/auth/accept-invitation-form";
import { AuthTemplate } from "@/components/features/auth/auth-template";
import { useTranslations } from "@/i18n";

type AcceptInvitationViewProps = {
  invitationId: string;
};

export function AcceptInvitationView({
  invitationId,
}: AcceptInvitationViewProps) {
  const t = useTranslations("auth");

  return (
    <AuthTemplate
      title={t("acceptInvitationTitle")}
      description={t("acceptInvitationDescription")}
      form={<AcceptInvitationForm invitationId={invitationId} />}
    />
  );
}
