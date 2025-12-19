import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignUpForm } from "@/components/features/sign/sign-up-form";

export async function SignUpView() {
  const t = await getTranslations("auth");

  return (
    <AuthTemplate
      title={t("createAccountTitle")}
      description={
        <>
          {t("createAccountDescription")} <br />
          {t("alreadyHaveAccount")}{" "}
          <Link
            href="/auth/signin"
            className="hover:text-primary underline underline-offset-4"
          >
            {t("login")}
          </Link>
        </>
      }
      form={<SignUpForm />}
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
