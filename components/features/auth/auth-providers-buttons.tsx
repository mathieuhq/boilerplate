"use client";

import { Chrome, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClientService } from "@/services/auth/auth-client.service";
import { useMutation } from "@tanstack/react-query";

type SocialAuthButtonsProps = {
  disabled?: boolean;
};

export const SocialAuthButtons = ({ disabled }: SocialAuthButtonsProps) => {
  const githubSignIn = useMutation({
    mutationFn: async () => authClientService.signInWithProvider("github"),
  });

  const googleSignIn = useMutation({
    mutationFn: async () => authClientService.signInWithProvider("google"),
  });

  const isLoading = Boolean(githubSignIn.isPending || googleSignIn.isPending);

  return (
    <>
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Or continue with
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full lg:w-1/2"
          disabled={disabled ?? isLoading}
          onClick={() => githubSignIn.mutate()}
        >
          <Github className="size-4" /> GitHub
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full lg:w-1/2"
          disabled={disabled ?? isLoading}
          onClick={() => googleSignIn.mutate()}
        >
          <Chrome className="size-4" /> Google
        </Button>
      </div>
    </>
  );
};
