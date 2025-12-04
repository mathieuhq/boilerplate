import { userController } from "@/controllers/user.controller";
import { BillingSettingsView } from "@/views/settings/billing";

export default async function BillingPage() {
  const { user, subscription } =
    await userController.getCurrentUserWithSubscription();

  return (
    <BillingSettingsView subscription={subscription} userEmail={user.email} />
  );
}
