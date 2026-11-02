import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { useTranslations } from "@/i18n";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormButton } from "../form/form-button";

const createSignResetFormSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    email: z.email({ message: t("validation.invalidEmail") }),
  });

type SignResetFormValues = z.infer<
  ReturnType<typeof createSignResetFormSchema>
>;

type SignResetFormProps = HTMLAttributes<HTMLDivElement>;

export const SignResetForm = ({ className, ...props }: SignResetFormProps) => {
  const t = useTranslations("auth");

  const formSchema = useMemo(() => createSignResetFormSchema(t), [t]);
  const resolver = useMemo(() => zodResolver(formSchema), [formSchema]);

  const form = useForm<SignResetFormValues>({
    resolver,
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
        <div className="grid gap-4">
          <FormField
            name="email"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="username"
                    placeholder={t("emailPlaceholder")}
                    {...field}
                  />
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
