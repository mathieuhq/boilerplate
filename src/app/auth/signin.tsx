import { createFileRoute } from "@tanstack/react-router";

import { useOAuthAuthorizeUrl } from "@/hooks/use-oauth-authorize-url";
import { getSafeCallbackUrl } from "@/lib/auth-callback";
import { getPageMetaTags } from "@/lib/seo";
import { getSocialProviders } from "@/server-functions/auth.functions";
import { SignInView } from "@/views/sign/signin";

export const Route = createFileRoute("/auth/signin")({
  head: () => ({
    meta: getPageMetaTags("signin"),
  }),
  validateSearch: (
    search: Record<string, unknown>,
  ): { callbackUrl?: string; error?: string } => ({
    callbackUrl:
      typeof search.callbackUrl === "string" ? search.callbackUrl : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  loader: async () => getSocialProviders(),
  component: SignInPage,
});

function SignInPage() {
  const { callbackUrl, error } = Route.useSearch();
  const socialProviders = Route.useLoaderData();
  const oauthAuthorizeUrl = useOAuthAuthorizeUrl();

  return (
    <SignInView
      callbackUrl={oauthAuthorizeUrl ?? getSafeCallbackUrl(callbackUrl)}
      error={error}
      socialProviders={socialProviders}
    />
  );
}
