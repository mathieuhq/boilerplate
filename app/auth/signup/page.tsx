import Link from "next/link";

import { SignUpForm } from "@/components/features/sign/sign-up-form";

export default function SignUpPage() {
  return (
    <>
      <div className="mb-2 flex flex-col space-y-2 text-left">
        <h1 className="text-lg font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and password to create an account. <br />
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="hover:text-primary underline underline-offset-4"
          >
            Log In
          </Link>
        </p>
      </div>
      <SignUpForm />
      <p className="text-muted-foreground mt-4 px-8 text-center text-sm">
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
      </p>
    </>
  );
}
