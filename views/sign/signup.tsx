import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignUpForm } from "@/components/features/sign/sign-up-form";
import { useTranslations } from "@/i18n";
import Link from "@/lib/navigation";

type SignUpViewProps = {
  callbackUrl?: string;
};

export function SignUpView({ callbackUrl = "/" }: SignUpViewProps) {
  const t = useTranslations("auth");

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
            className="underline underline-offset-4 hover:text-primary"
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
            className="underline underline-offset-4 hover:text-primary"
          >
            {t("termsOfService")}
          </Link>{" "}
          {t("and")}{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            {t("privacyPolicy")}
          </Link>
          .
        </>
      }
    />
  );
}
