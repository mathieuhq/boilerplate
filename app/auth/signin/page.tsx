import type { Metadata } from "next";

import { getSafeCallbackUrl } from "@/lib/auth-callback";
import { getPageMetadata } from "@/lib/seo";
import { SignInView } from "@/views/sign/signin";

export const metadata: Metadata = getPageMetadata("signin");

type SignInPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl } = await searchParams;

  return <SignInView callbackUrl={getSafeCallbackUrl(callbackUrl)} />;
}
