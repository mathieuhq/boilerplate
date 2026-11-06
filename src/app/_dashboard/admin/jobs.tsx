import { createFileRoute, redirect } from "@tanstack/react-router";

import { BULL_BOARD_PATH } from "@/shared/infrastructure/jobs/bull-board";

export const Route = createFileRoute("/_dashboard/admin/jobs")({
  beforeLoad: () => {
    throw redirect({ href: `${BULL_BOARD_PATH}/`, reloadDocument: true });
  },
});
