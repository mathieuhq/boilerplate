"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { HTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  type ResetPasswordInput,
  resetPasswordSchema,
} from "@/schemas/auth/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { FormButton } from "../form/form-button";

export const SignPasswordForm = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const t = useTranslations("auth");

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      if (!token) throw new Error(t("resetTokenMissing"));

      const response = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });
      if (response.error) throw new Error(response.error.message);
      return response;
    },
    onSuccess: () => {
      toast.success(t("passwordResetSuccess"));
      router.push("/auth/signin");
    },
    onError: (error: Error) =>
      toast.error(error.message || t("passwordResetError")),
  });

  if (!token) {
    return (
      <div className="border-destructive bg-destructive/10 rounded-md border p-4">
        <p className="text-destructive text-sm font-medium">
          {t("invalidResetToken")}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form form={form} disabled={isPending} onSubmit={async (v) => mutate(v)}>
        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>{t("newPassword")}</FormLabel>
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
            {t("resetPassword")}
          </FormButton>
        </div>
      </Form>
    </div>
  );
};
