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
import { PasswordInput } from "@/components/ui/password-input";
import { useTranslations } from "@/i18n";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormButton } from "../form/form-button";

const passwordValidation = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter",
  })
  .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter",
  })
  .regex(/[0-9]/, { message: "Password must contain at least one number" });

const resetPasswordSchema = z
  .object({
    password: passwordValidation,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

type SignPasswordFormProps = HTMLAttributes<HTMLDivElement>;

export const SignPasswordForm = ({
  className,
  ...props
}: SignPasswordFormProps) => {
  const router = useRouter();
  const t = useTranslations("auth");
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

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

  if (!token)
    return (
      <div className="border-destructive bg-destructive/10 rounded-md border p-4">
        <p className="text-destructive text-sm font-medium">
          {t("invalidResetToken")}
        </p>
      </div>
    );

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form form={form} disabled={isPending} onSubmit={async (v) => mutate(v)}>
        <div className="grid gap-2">
          <FormField
            name="password"
            control={form.control}
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
