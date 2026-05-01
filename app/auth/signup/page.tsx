import type { Metadata } from "next";

import { getSafeCallbackUrl } from "@/lib/auth-callback";
import { getPageMetadata } from "@/lib/seo";
import { SignUpView } from "@/views/sign/signup";

export const metadata: Metadata = getPageMetadata("signup");

type SignUpPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { callbackUrl } = await searchParams;

  return <SignUpView callbackUrl={getSafeCallbackUrl(callbackUrl)} />;
}
