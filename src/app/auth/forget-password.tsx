import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { SignResetView } from "@/views/sign/reset";

export const Route = createFileRoute("/auth/forget-password")({
  head: () => ({
    meta: getPageMetaTags("forgetPassword"),
  }),
  component: SignResetView,
});
