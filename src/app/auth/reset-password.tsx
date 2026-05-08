import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { SignResetPasswordView } from "@/views/sign/reset-password";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: getPageMetaTags("resetPassword"),
  }),
  component: SignResetPasswordView,
});
