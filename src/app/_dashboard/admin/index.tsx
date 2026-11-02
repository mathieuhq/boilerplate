import { createFileRoute, redirect } from "@tanstack/react-router";

import { getFirstAdminPage } from "@/lib/admin-access";

export const Route = createFileRoute("/_dashboard/admin/")({
  beforeLoad: ({ context }) => {
    throw redirect({ to: getFirstAdminPage(context.access) ?? "/" });
  },
});
