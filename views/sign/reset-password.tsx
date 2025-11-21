import Link from "next/link";

import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignPasswordForm } from "@/components/features/sign/sign-password-form";

export const SignResetPasswordView = () => (
  <AuthTemplate
    title="Set new password"
    description={
      <>
        Enter your new password below. <br />
        Make sure it&apos;s strong and secure.
      </>
    }
    form={<SignPasswordForm />}
    footer={
      <>
        Remember your password?{" "}
        <Link
          href="/auth/signin"
          className="hover:text-primary underline underline-offset-4"
        >
          Sign in
        </Link>
      </>
    }
  />
);
