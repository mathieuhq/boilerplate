import { useMutation } from "@tanstack/react-query";

import { LoadingButton } from "@/components/features/form/form-button";
import { useTranslations } from "@/i18n";
import { authClient } from "@/lib/auth-client";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.438 9.8 8.205 11.387.6.11.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.305-5.467-1.332-5.467-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.49 11.49 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.62-5.48 5.92.43.37.812 1.1.812 2.22 0 1.606-.015 2.898-.015 3.293 0 .32.216.694.825.576C20.565 22.296 24 17.795 24 12.5 24 5.87 18.627.5 12 .5Z" />
  </svg>
);

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
    />
  </svg>
);

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
          <span className="bg-card text-muted-foreground px-2">
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
          <GithubIcon className="size-4" /> GitHub
        </LoadingButton>
        <LoadingButton
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full"
          loading={googleSignIn.isPending}
          onClick={() => googleSignIn.mutate()}
        >
          <GoogleIcon className="size-4" /> Google
        </LoadingButton>
      </div>
    </>
  );
};
