"use client";

import { useTranslations } from "next-intl";
import { Chrome, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";

type SocialAuthButtonsProps = {
  disabled?: boolean;
};

export const SocialAuthButtons = ({ disabled }: SocialAuthButtonsProps) => {
  const t = useTranslations("common");

  const githubSignIn = useMutation({
    mutationFn: async () => {
      const response = await authClient.signIn.social({ provider: "github" });
      if (response.error) throw new Error(response.error.message);
      return response;
    },
  });

  const googleSignIn = useMutation({
    mutationFn: async () => {
      const response = await authClient.signIn.social({ provider: "google" });
      if (response.error) throw new Error(response.error.message);
      return response;
    },
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
            {t("orContinueWith")}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 lg:flex-row">
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
