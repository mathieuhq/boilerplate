"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
import { cn } from "@/lib/utils";
import {
  type ResetPasswordInput,
  resetPasswordSchema,
} from "@/schemas/auth/auth.schema";
import { authClientService } from "@/services/auth/auth-client.service";
import { ApplicationError } from "@/shared/domain/errors/application.error";
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

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      if (!token) throw new ApplicationError("Reset token is missing");

      return authClientService.resetPassword({
        newPassword: data.password,
        token,
      });
    },
    onSuccess: () => {
      toast.success("Password reset successfully! You can now sign in.");
      router.push("/auth/signin");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to reset password"),
  });

  if (!token) {
    return (
      <div className="border-destructive bg-destructive/10 rounded-md border p-4">
        <p className="text-destructive text-sm font-medium">
          Invalid or missing reset token. Please request a new password reset
          link.
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
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="********" {...field} />
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
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormButton loading={isPending} className="mt-2">
            Reset Password
          </FormButton>
        </div>
      </Form>
    </div>
  );
};
