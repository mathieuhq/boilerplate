import { Suspense } from "react";
import Link from "next/link";

import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignPasswordForm } from "@/components/features/sign/sign-password-form";
import { Loader } from "@/components/ui/loader";

export const SignResetPasswordView = () => (
  <AuthTemplate
    title="Set new password"
    description={
      <>
        Enter your new password below. <br />
        Make sure it&apos;s strong and secure.
      </>
    }
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
