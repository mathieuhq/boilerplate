import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignTwoFactorForm } from "@/components/features/sign/sign-two-factor-form";
import { useTranslations } from "@/i18n";
import Link from "@/lib/navigation";

type TwoFactorViewProps = {
  callbackUrl?: string;
};

export function TwoFactorView({ callbackUrl = "/" }: TwoFactorViewProps) {
  const t = useTranslations("auth");

  return (
    <AuthTemplate
      title={t("twoFactorTitle")}
      description={t("twoFactorDescription")}
      form={<SignTwoFactorForm callbackUrl={callbackUrl} />}
      footer={
        <Link
          href="/auth/signin"
          className="hover:text-primary underline underline-offset-4"
        >
          {t("backToSignIn")}
        </Link>
      }
    />
  );
}
