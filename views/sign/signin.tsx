import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignInForm } from "@/components/features/sign/sign-in-form";
import { useTranslations } from "@/i18n";
import Link from "@/lib/navigation";

type SignInViewProps = {
  callbackUrl?: string;
};

export function SignInView({ callbackUrl = "/" }: SignInViewProps) {
  const t = useTranslations("auth");

  const signUpHref =
    callbackUrl === "/"
      ? "/auth/signup"
      : `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <AuthTemplate
      title={t("welcomeBack")}
      description={
        <>
          {t("enterCredentials")} <br />
          {t("dontHaveAccount")}{" "}
          <Link
            href={signUpHref}
            className="hover:text-primary underline underline-offset-4"
          >
            {t("signUp")}
          </Link>
        </>
      }
      form={<SignInForm callbackUrl={callbackUrl} />}
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
