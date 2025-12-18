import type { Metadata } from "next";

import { env } from "@/lib/env";
import { getPageMetadata } from "@/lib/seo";
import { container } from "@/shared/infrastructure/di/container";
import { BillingSettingsView } from "@/views/settings/billing";

export const metadata: Metadata = getPageMetadata("settingsBilling");

export default async function BillingPage() {
  const userController = container.getUserController();
  const { user, subscription } =
    await userController.getCurrentUserWithSubscription();

  return (
    <BillingSettingsView
      userEmail={user.email}
      subscription={subscription}
      zenvoiceUrl={env.ZENVOICE_URL}
    />
  );
}
