import { getTranslations } from "next-intl/server";

import { OrganizationForm } from "@/components/features/dashboard/form/organization-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
};

type OrganizationSettingsViewProps = {
  organization: Organization;
};

export async function OrganizationSettingsView({
  organization,
}: OrganizationSettingsViewProps) {
  const t = await getTranslations("organization");

  return (
    <PageLayout title={t("settings")} desc={t("description")}>
      <OrganizationForm organization={organization} />
    </PageLayout>
  );
}
