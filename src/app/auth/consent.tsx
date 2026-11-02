import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getSession } from "@/server-functions/auth.functions";
import { getOAuthConsentData } from "@/server-functions/oauth.functions";
import { OAuthConsentView } from "@/views/sign/oauth-consent";

export const Route = createFileRoute("/auth/consent")({
  head: () => ({
    meta: getPageMetaTags("oauthConsent"),
  }),
  loader: async ({ location }) => {
    const params = new URLSearchParams(location.searchStr);
    const clientId = params.get("client_id");

    if (!clientId) throw notFound();

    const session = await getSession();

    if (!session?.user)
      throw redirect({
        to: "/auth/signin",
        search: { callbackUrl: undefined },
      });

    const client = await getOAuthConsentData({ clientId });
    const scopes = params.get("scope")?.split(" ").filter(Boolean) ?? [];

    return { client, scopes };
  },
  component: OAuthConsentPage,
});

function OAuthConsentPage() {
  const { client, scopes } = Route.useLoaderData();

  return (
    <OAuthConsentView
      scopes={scopes}
      clientUri={client.clientUri}
      clientName={client.clientName}
    />
  );
}
