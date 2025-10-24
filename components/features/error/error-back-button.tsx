"use client";

import { useRouter } from "next/navigation";

import { Button, type ButtonProps } from "@/components/ui/button";

export const ErrorBackButton = ({
  variant = "outline",
  children = "Go Back",
  ...props
}: ButtonProps) => {
  const router = useRouter();

  return (
    <Button variant={variant} onClick={() => router.back()} {...props}>
      {children}
    </Button>
  );
};
