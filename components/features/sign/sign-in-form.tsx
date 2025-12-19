"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { HTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { SocialAuthButtons } from "../auth/auth-providers-buttons";
import { FormButton } from "../form/form-button";

export const SignInForm = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const router = useRouter();
  const t = useTranslations("auth");

  const formSchema = useMemo(
    () =>
      z.object({
        email: z.email({ message: t("validation.invalidEmail") }),
        password: z
          .string()
          .min(1, { message: t("validation.passwordRequired") })
          .min(8, { message: t("validation.passwordMinLength") }),
      }),
    [t],
  );

  const resolver = useMemo(() => zodResolver(formSchema), [formSchema]);

  type SignInFormValues = z.infer<typeof formSchema>;

  const form = useForm<SignInFormValues>({
    resolver,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: SignInFormValues) => {
      const response = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });
      if (response.error) throw new Error(response.error.message);
      return response;
    },
    onSuccess: () => router.push("/"),
    onError: (error: Error) => toast.error(error.message || t("loginError")),
  });

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form form={form} disabled={isPending} onSubmit={async (v) => mutate(v)}>
        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("emailPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div className="flex items-center justify-between">
                  <FormLabel>{t("password")}</FormLabel>
                  <Link
                    href="/auth/forget-password"
                    className="text-muted-foreground text-sm font-medium hover:opacity-75"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    placeholder={t("passwordPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormButton loading={isPending} className="mt-2">
            {t("login")}
          </FormButton>

          <SocialAuthButtons disabled={isPending} />
        </div>
      </Form>
    </div>
  );
};
