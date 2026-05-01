import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignUpForm } from "@/components/features/sign/sign-up-form";

type SignUpViewProps = {
  callbackUrl?: string;
};

export async function SignUpView({ callbackUrl = "/" }: SignUpViewProps) {
  const t = await getTranslations("auth");

  const signInHref =
    callbackUrl === "/"
      ? "/auth/signin"
      : `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <AuthTemplate
      title={t("createAccountTitle")}
      description={
        <>
          {t("createAccountDescription")} <br />
          {t("alreadyHaveAccount")}{" "}
          <Link
            href={signInHref}
            className="hover:text-primary underline underline-offset-4"
          >
            {t("login")}
          </Link>
        </>
      }
      form={<SignUpForm callbackUrl={callbackUrl} />}
      footer={
        <>
          {t("createTermsAgreement")} <br />
          <Link
            href="/terms"
            className="hover:text-primary underline underline-offset-4"
          >
            {t("termsOfService")}
          </Link>{" "}
          {t("and")}{" "}
          <Link
            href="/privacy"
            className="hover:text-primary underline underline-offset-4"
          >
            {t("privacyPolicy")}
          </Link>
          .
        </>
      }
    />
  );
}
