import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";
import { container } from "@/shared/infrastructure/di/container";
import { AdminOverviewView } from "@/views/admin/overview";

export const metadata: Metadata = getPageMetadata("adminOverview");

export default async function AdminOverviewPage() {
  const adminController = container.getAdminController();
  const stats = await adminController.getRegistrationStats(30);

  return <AdminOverviewView stats={stats} />;
}
