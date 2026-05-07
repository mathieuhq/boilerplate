import { createFileRoute, redirect } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getSession } from "@/server-functions/auth.functions";
import { AcceptInvitationView } from "@/views/sign/accept-invitation";

export const Route = createFileRoute("/auth/accept-invitation/$invitationId")({
  head: () => ({
    meta: getPageMetaTags("acceptInvitation"),
  }),
  loader: async ({ params }) => {
    const session = await getSession();

    if (!session?.user) {
      const callbackUrl = `/auth/accept-invitation/${encodeURIComponent(
        params.invitationId,
      )}`;

      throw redirect({
        to: "/auth/signin",
        search: { callbackUrl },
      });
    }

    return { invitationId: params.invitationId };
  },
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const { invitationId } = Route.useLoaderData();

  return <AcceptInvitationView invitationId={invitationId} />;
}
