import { BillingForm } from "@/components/features/dashboard/form/billing-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import { useTranslations } from "@/i18n";

type BillingSettingsViewProps = {
  organizationId: string;
};

export function BillingSettingsView({
  organizationId,
}: BillingSettingsViewProps) {
  const t = useTranslations("settings.billing");

  return (
    <PageLayout title={t("title")} desc={t("description")}>
      <BillingForm organizationId={organizationId} />
    </PageLayout>
  );
}
