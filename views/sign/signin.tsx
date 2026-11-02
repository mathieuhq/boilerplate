import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignInForm } from "@/components/features/sign/sign-in-form";
import { useTranslations } from "@/i18n";
import Link from "@/lib/navigation";
import type { SocialProvider } from "@/lib/social-providers";

type SignInViewProps = {
  callbackUrl?: string;
  socialProviders: SocialProvider[];
};

export function SignInView({
  callbackUrl = "/",
  socialProviders,
}: SignInViewProps) {
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
            className="underline underline-offset-4 hover:text-primary"
          >
            {t("signUp")}
          </Link>
        </>
      }
      form={
        <SignInForm
          callbackUrl={callbackUrl}
          socialProviders={socialProviders}
        />
      }
      footer={
        <>
          {t("termsAgreement")} <br />
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
