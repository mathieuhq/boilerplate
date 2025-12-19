"use client";

import { useMemo } from "react";
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
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { FormButton } from "../form/form-button";

export const SignResetForm = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const t = useTranslations("auth");

  const formSchema = useMemo(
    () =>
      z.object({
        email: z.string().email({ message: t("validation.invalidEmail") }),
      }),
    [t],
  );

  type SignResetFormValues = z.infer<typeof formSchema>;

  const form = useForm<SignResetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: SignResetFormValues) => {
      const response = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: "/auth/reset-password",
      });
      if (response.error) throw new Error(response.error.message);
      return response;
    },
    onSuccess: () => {
      toast.success(t("passwordResetEmailSent"));
      form.reset();
    },
    onError: (error: Error) =>
      toast.error(error.message || t("passwordResetEmailError")),
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
          <FormButton loading={isPending} className="mt-2">
            {t("sendResetLink")}
          </FormButton>
        </div>
      </Form>
    </div>
  );
};
