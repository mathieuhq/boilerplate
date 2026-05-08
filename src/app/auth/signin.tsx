import { createFileRoute } from "@tanstack/react-router";

import { getSafeCallbackUrl } from "@/lib/auth-callback";
import { getPageMetaTags } from "@/lib/seo";
import { SignInView } from "@/views/sign/signin";

export const Route = createFileRoute("/auth/signin")({
  head: () => ({
    meta: getPageMetaTags("signin"),
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    callbackUrl:
      typeof search.callbackUrl === "string" ? search.callbackUrl : undefined,
  }),
  component: SignInPage,
});

function SignInPage() {
  const { callbackUrl } = Route.useSearch();

  return <SignInView callbackUrl={getSafeCallbackUrl(callbackUrl)} />;
}
