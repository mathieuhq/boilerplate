import { container } from "@/shared/infrastructure/di/container";
import { BillingSettingsView } from "@/views/settings/billing";

export default async function BillingPage() {
  const userController = container.getUserController();
  const { user, subscription } =
    await userController.getCurrentUserWithSubscription();

  return (
    <BillingSettingsView subscription={subscription} userEmail={user.email} />
  );
}
