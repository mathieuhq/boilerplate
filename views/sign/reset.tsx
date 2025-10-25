import Link from "next/link";

import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignResetForm } from "@/components/features/sign/sign-reset-form";

export const SignResetView = () => (
  <AuthTemplate
    title="Reset your password"
    description={
      <>
        Enter your email address and we will send you <br />a link to reset your
        password.
      </>
    }
    form={<SignResetForm />}
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
