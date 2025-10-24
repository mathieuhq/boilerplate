import Link from "next/link";

import { SignInForm } from "@/components/features/sign/sign-in-form";

export default function SignInPage() {
  return (
    <>
      <div className="mb-2 flex flex-col space-y-2 text-left">
        <h1 className="text-lg font-semibold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and password below <br />
          to log into your account.
        </p>
      </div>
      <SignInForm />
      <p className="text-muted-foreground mt-4 px-8 text-center text-sm">
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
      </p>
    </>
  );
}
