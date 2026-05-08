import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignResetForm } from "@/components/features/sign/sign-reset-form";
import { useTranslations } from "@/i18n";
import Link from "@/lib/navigation";

export function SignResetView() {
  const t = useTranslations("auth");

  return (
    <AuthTemplate
      form={<SignResetForm />}
      title={t("resetPasswordTitle")}
      description={t("resetPasswordDescription")}
      footer={
        <>
          {t("rememberPassword")}{" "}
          <Link
            href="/auth/signin"
            className="hover:text-primary underline underline-offset-4"
          >
            {t("signIn")}
          </Link>
        </>
      }
    />
  );
}
