import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignResetForm } from "@/components/features/sign/sign-reset-form";

export async function SignResetView() {
  const t = await getTranslations("auth");

  return (
    <AuthTemplate
      title={t("resetPasswordTitle")}
      description={t("resetPasswordDescription")}
      form={<SignResetForm />}
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
