import { createFileRoute } from "@tanstack/react-router";

import { getSafeCallbackUrl } from "@/lib/auth-callback";
import { getPageMetaTags } from "@/lib/seo";
import { TwoFactorView } from "@/views/sign/two-factor";

export const Route = createFileRoute("/auth/two-factor")({
  head: () => ({
    meta: getPageMetaTags("twoFactor"),
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    callbackUrl:
      typeof search.callbackUrl === "string" ? search.callbackUrl : undefined,
  }),
  component: TwoFactorPage,
});

function TwoFactorPage() {
  const { callbackUrl } = Route.useSearch();

  return <TwoFactorView callbackUrl={getSafeCallbackUrl(callbackUrl)} />;
}
