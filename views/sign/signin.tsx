import Link from "next/link";

import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignInForm } from "@/components/features/sign/sign-in-form";

export const SignInView = () => (
  <AuthTemplate
    title="Welcome back!"
    description={
      <>
        Enter your email and password to log in. <br />
        Don't have an account?{" "}
        <Link
          href="/auth/signup"
          className="hover:text-primary underline underline-offset-4"
        >
          Sign up
        </Link>
      </>
    }
    form={<SignInForm />}
    footer={
      <>
        By clicking login, you agree to our <br />
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
