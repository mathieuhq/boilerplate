import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getPageMetadata } from "@/lib/seo";
import { AcceptInvitationView } from "@/views/sign/accept-invitation";

export const metadata: Metadata = getPageMetadata("acceptInvitation");

type AcceptInvitationPageProps = {
  params: Promise<{
    invitationId: string;
  }>;
};

export default async function AcceptInvitationPage({
  params,
}: AcceptInvitationPageProps) {
  const { invitationId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    const callbackUrl = `/auth/accept-invitation/${encodeURIComponent(
      invitationId,
    )}`;

    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return <AcceptInvitationView invitationId={invitationId} />;
}
