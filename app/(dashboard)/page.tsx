import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getPageMetadata("dashboard");

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
    </div>
  );
}
