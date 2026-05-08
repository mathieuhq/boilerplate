import { Suspense } from "react";

import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignPasswordForm } from "@/components/features/sign/sign-password-form";
import { Loader } from "@/components/ui/loader";
import { useTranslations } from "@/i18n";
import Link from "@/lib/navigation";

export function SignResetPasswordView() {
  const t = useTranslations("auth");

  return (
    <AuthTemplate
      title={t("setNewPasswordTitle")}
      description={t("setNewPasswordDescription")}
      form={
        <Suspense
          fallback={
            <div className="grid animate-pulse gap-6">
              <Loader />
            </div>
          }
        >
          <SignPasswordForm />
        </Suspense>
      }
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
