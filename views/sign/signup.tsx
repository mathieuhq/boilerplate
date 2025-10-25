import Link from "next/link";

import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignUpForm } from "@/components/features/sign/sign-up-form";

export const SignUpView = () => (
  <AuthTemplate
    title="Create an account"
    description={
      <>
        Enter your email and password to create an account. <br />
        Already have an account?{" "}
        <Link
          href="/auth/signin"
          className="hover:text-primary underline underline-offset-4"
        >
          Log In
        </Link>
      </>
    }
    form={<SignUpForm />}
    footer={
      <>
        By creating an account, you agree to our <br />
        <Link
          href="/terms"
          className="hover:text-primary underline underline-offset-4"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="hover:text-primary underline underline-offset-4"
        >
          Privacy Policy
        </Link>
        .
      </>
    }
  />
);
