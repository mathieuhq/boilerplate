import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignInForm } from "@/components/features/sign/sign-in-form";

export async function SignInView() {
  const t = await getTranslations("auth");

  return (
    <AuthTemplate
      title={t("welcomeBack")}
      description={
        <>
          {t("enterCredentials")} <br />
          {t("dontHaveAccount")}{" "}
          <Link
            href="/auth/signup"
            className="hover:text-primary underline underline-offset-4"
          >
            {t("signUp")}
          </Link>
        </>
      }
      form={<SignInForm />}
      footer={
        <>
          {t("termsAgreement")} <br />
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
