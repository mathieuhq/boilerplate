import { integrationController } from "@/controllers/integration.controller";
import { userController } from "@/controllers/user.controller";
import { IntegrationsSettingsView } from "@/views/settings/integrations";

export default async function IntegrationsPage() {
  const user = await userController.getCurrentUser();

  const integrations = await integrationController.getUserIntegrations(user.id);

  return <IntegrationsSettingsView connectedIntegrations={integrations} />;
}
