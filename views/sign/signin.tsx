import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignInForm } from "@/components/features/sign/sign-in-form";
import { useTranslations } from "@/i18n";
import Link from "@/lib/navigation";
import type { SocialProvider } from "@/lib/social-providers";

type SignInViewProps = {
  callbackUrl?: string;
  error?: string;
  socialProviders: SocialProvider[];
};

export function SignInView({
  callbackUrl = "/",
  error,
  socialProviders,
}: SignInViewProps) {
  const t = useTranslations("auth");

  return (
    <AuthTemplate
      title={t("welcomeBack")}
      description={t("enterEmail")}
      form={
        <SignInForm
          callbackUrl={callbackUrl}
          error={error}
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
