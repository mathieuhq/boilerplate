import { createFileRoute } from "@tanstack/react-router";

import { getSafeCallbackUrl } from "@/lib/auth-callback";
import { getPageMetaTags } from "@/lib/seo";
import { getSocialProviders } from "@/server-functions/auth.functions";
import { SignUpView } from "@/views/sign/signup";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({
    meta: getPageMetaTags("signup"),
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    callbackUrl:
      typeof search.callbackUrl === "string" ? search.callbackUrl : undefined,
  }),
  loader: async () => getSocialProviders(),
  component: SignUpPage,
});

function SignUpPage() {
  const { callbackUrl } = Route.useSearch();
  const socialProviders = Route.useLoaderData();

  return (
    <SignUpView
      callbackUrl={getSafeCallbackUrl(callbackUrl)}
      socialProviders={socialProviders}
    />
  );
}
