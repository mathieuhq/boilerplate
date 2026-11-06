import { useMemo, useState } from "react";
import type { HTMLAttributes } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/lib/navigation";
import type { SocialProvider } from "@/lib/social-providers";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";

import { SocialAuthButtons } from "../auth/auth-providers-buttons";
import { FormButton, LoadingButton } from "../form/form-button";

const createSignInFormSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    email: z.email({ message: t("validation.invalidEmail") }),
  });

type SignInFormValues = z.infer<ReturnType<typeof createSignInFormSchema>>;

type SignInFormProps = HTMLAttributes<HTMLDivElement> & {
  callbackUrl?: string;
  error?: string;
  socialProviders: SocialProvider[];
};

export const SignInForm = ({
  callbackUrl = "/",
  error,
  socialProviders,
  className,
  ...props
}: SignInFormProps) => {
  const router = useRouter();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const t = useTranslations("auth");

  const formSchema = useMemo(() => createSignInFormSchema(t), [t]);
  const resolver = useMemo(() => zodResolver(formSchema), [formSchema]);

  const form = useForm<SignInFormValues>({
    resolver,
    defaultValues: {
      email: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ email }: SignInFormValues) => {
      const signInUrl =
        callbackUrl === "/"
          ? "/auth/signin"
          : `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;

      const response = await authClient.signIn.magicLink({
        email,
        name: email.split("@")[0],
        callbackURL: callbackUrl,
        errorCallbackURL: signInUrl,
      });

      if (response.error) throw new Error(response.error.message);

      return email;
    },
    onSuccess: (email) => setSentTo(email),
    onError: (error: Error) =>
      toast.error(error.message || t("magicLinkError")),
  });

  const passkeySignIn = useMutation({
    mutationFn: async () => {
      const response = await authClient.signIn.passkey();

      if (response.error) throw new Error(response.error.message);

      return response;
    },
    onSuccess: () => router.push(callbackUrl),
    onError: (error: Error) =>
      toast.error(error.message || t("passkeyLoginError")),
  });

  const isBusy = isPending || passkeySignIn.isPending;

  if (sentTo)
    return (
      <div className={cn("grid gap-4 text-center", className)} {...props}>
        <p className="text-sm text-muted-foreground">
          {t("magicLinkSent", { email: sentTo })}
        </p>
        <Button variant="outline" onClick={() => setSentTo(null)}>
          {t("useAnotherEmail")}
        </Button>
      </div>
    );

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive bg-destructive/10 p-4"
        >
          <p className="text-sm font-medium text-destructive">
            {t("magicLinkInvalid")}
          </p>
        </div>
      )}
      <Form form={form} disabled={isBusy} onSubmit={async (v) => mutate(v)}>
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="username webauthn"
                    placeholder={t("emailPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormButton loading={isPending} className="mt-2">
            {t("sendMagicLink")}
          </FormButton>

          <LoadingButton
            type="button"
            variant="outline"
            disabled={isBusy}
            loading={passkeySignIn.isPending}
            onClick={() => passkeySignIn.mutate()}
          >
            {t("signInWithPasskey")}
          </LoadingButton>

          <SocialAuthButtons
            providers={socialProviders}
            callbackUrl={callbackUrl}
            disabled={isBusy}
          />
        </div>
      </Form>
    </div>
  );
};
