import Link from "next/link";

import { SignResetForm } from "@/components/features/sign/sign-reset-form";

export default function ForgetPasswordPage() {
  return (
    <>
      <div className="mb-2 flex flex-col space-y-2 text-left">
        <h1 className="text-lg font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your email address and we will send you <br />a link to reset
          your password.
        </p>
      </div>
      <SignResetForm />
      <p className="text-muted-foreground mt-4 text-center text-sm">
        Remember your password?{" "}
        <Link
          href="/auth/signin"
          className="hover:text-primary underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
