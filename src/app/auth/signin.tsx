import { createFileRoute } from "@tanstack/react-router";

import { useOAuthAuthorizeUrl } from "@/hooks/use-oauth-authorize-url";
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
  const oauthAuthorizeUrl = useOAuthAuthorizeUrl();

  return (
    <SignInView
      callbackUrl={oauthAuthorizeUrl ?? getSafeCallbackUrl(callbackUrl)}
    />
  );
}
