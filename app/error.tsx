"use client";

import { useEffect } from "react";

import { captureUnexpectedError } from "@/lib/glitchtip";
import { InternalServerErrorView } from "@/views/errors/500";

type ErrorProps = {
  reset: () => void;
  error: Error & { digest?: string };
};

export default function Error({ error }: ErrorProps) {
  useEffect(() => captureUnexpectedError(error), [error]);

  return <InternalServerErrorView />;
}
