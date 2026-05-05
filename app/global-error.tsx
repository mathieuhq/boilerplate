"use client";

import { useEffect } from "react";

import { ErrorTemplate } from "@/components/features/error/error-template";
import { captureUnexpectedError } from "@/lib/glitchtip";

type GlobalErrorProps = {
  reset: () => void;
  error: Error & { digest?: string };
};

export default function GlobalError({ error }: GlobalErrorProps) {
  useEffect(() => captureUnexpectedError(error), [error]);

  return (
    <html lang="en">
      <body>
        <ErrorTemplate
          code={500}
          title="Something went wrong"
          description="An unexpected error occurred."
          goBackLabel="Go back"
          backToHomeLabel="Back to home"
        />
      </body>
    </html>
  );
}
