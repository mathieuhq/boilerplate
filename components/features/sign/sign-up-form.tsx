"use client";

import { useMemo } from "react";
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

export const SignUpForm = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const router = useRouter();
  const t = useTranslations("auth");

  const formSchema = useMemo(
    () =>
      z
        .object({
          email: z.email({ message: t("validation.invalidEmail") }),
          password: z
            .string()
            .min(1, { message: t("validation.passwordRequired") })
            .min(8, { message: t("validation.passwordMinLength8") }),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("validation.passwordsDontMatch"),
          path: ["confirmPassword"],
        }),
    [t],
  );

  const resolver = useMemo(() => zodResolver(formSchema), [formSchema]);

  type SignUpFormValues = z.infer<typeof formSchema>;

  const form = useForm<SignUpFormValues>({
    resolver,
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: SignUpFormValues) => {
      const response = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.email.split("@")[0],
      });
      if (response.error) throw new Error(response.error.message);
      return response;
    },
    onSuccess: () => {
      toast.success(t("accountCreatedSuccess"));
      router.push("/");
    },
    onError: (error: Error) =>
      toast.error(error.message || t("accountCreatedError")),
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
                <FormLabel>{t("password")}</FormLabel>
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
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>{t("confirmPassword")}</FormLabel>
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
            {t("createAccount")}
          </FormButton>

          <SocialAuthButtons disabled={isPending} />
        </div>
      </Form>
    </div>
  );
};
