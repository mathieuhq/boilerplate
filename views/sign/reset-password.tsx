import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignPasswordForm } from "@/components/features/sign/sign-password-form";
import { Loader } from "@/components/ui/loader";

export async function SignResetPasswordView() {
  const t = await getTranslations("auth");

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
