import { createFileRoute } from "@tanstack/react-router";

import { NotFoundView } from "@/views/errors/404";

export const Route = createFileRoute("/$")({
  component: NotFoundView,
});
