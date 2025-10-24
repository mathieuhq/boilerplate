"use client";

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
import { cn } from "@/lib/utils";
import { authClientService } from "@/services/auth/auth-client.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { SocialAuthButtons } from "../auth/auth-providers-buttons";
import { FormButton } from "../form/form-button";

const formSchema = z
  .object({
    email: z.email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(1, {
        message: "Please enter your password",
      })
      .min(8, {
        message: "Password must be at least 8 characters long",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof formSchema>;

export const SignUpForm = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: SignUpFormValues) => {
      return authClientService.signUp({
        email: data.email,
        password: data.password,
        callbackURL: "/dashboard",
      });
    },
    onSuccess: () => toast.success("Account created successfully!"),
    onError: (error: Error) =>
      toast.error(error.message || "Failed to create account"),
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} />
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
                <FormLabel>Password</FormLabel>
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
          <FormButton className="mt-2">Create Account</FormButton>

          <SocialAuthButtons disabled={isPending} />
        </div>
      </Form>
    </div>
  );
};
