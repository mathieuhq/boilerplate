import { createFileRoute } from "@tanstack/react-router";

import { getSafeCallbackUrl } from "@/lib/auth-callback";
import { getPageMetaTags } from "@/lib/seo";
import { SignUpView } from "@/views/sign/signup";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({
    meta: getPageMetaTags("signup"),
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    callbackUrl:
      typeof search.callbackUrl === "string" ? search.callbackUrl : undefined,
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { callbackUrl } = Route.useSearch();

  return <SignUpView callbackUrl={getSafeCallbackUrl(callbackUrl)} />;
}
