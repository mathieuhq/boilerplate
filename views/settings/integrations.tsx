import { IntegrationsForm } from "@/components/features/dashboard/form/integrations-form";
import { SettingsLayout } from "@/components/features/dashboard/settings/settings-layout";

type IntegrationsSettingsViewProps = {
  connectedIntegrations: {
    provider: string;
    status: string;
  }[];
};

export const IntegrationsSettingsView = ({
  connectedIntegrations,
}: IntegrationsSettingsViewProps) => (
  <SettingsLayout
    title="Integrations"
    desc="Connect your account with third-party services to sync your data."
  >
    <IntegrationsForm connectedIntegrations={connectedIntegrations} />
  </SettingsLayout>
);
