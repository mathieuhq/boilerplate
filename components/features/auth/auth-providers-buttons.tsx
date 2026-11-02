import { useMutation } from "@tanstack/react-query";

import { LoadingButton } from "@/components/features/form/form-button";
import { useTranslations } from "@/i18n";
import { authClient } from "@/lib/auth-client";

type SocialAuthButtonsProps = {
  callbackUrl?: string;
  disabled?: boolean;
};

export const SocialAuthButtons = ({
  callbackUrl = "/",
  disabled,
}: SocialAuthButtonsProps) => {
  const t = useTranslations("common");

  const githubSignIn = useMutation({
    mutationFn: async () => {
      const response = await authClient.signIn.social({
        provider: "github",
        callbackURL: callbackUrl,
      });

      if (response.error) throw new Error(response.error.message);

      return response;
    },
  });

  const googleSignIn = useMutation({
    mutationFn: async () => {
      const response = await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });

      if (response.error) throw new Error(response.error.message);

      return response;
    },
  });

  return (
    <>
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            {t("orContinueWith")}
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <LoadingButton
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full"
          loading={githubSignIn.isPending}
          onClick={() => githubSignIn.mutate()}
        >
          GitHub
        </LoadingButton>
        <LoadingButton
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full"
          loading={googleSignIn.isPending}
          onClick={() => googleSignIn.mutate()}
        >
          Google
        </LoadingButton>
      </div>
    </>
  );
};
