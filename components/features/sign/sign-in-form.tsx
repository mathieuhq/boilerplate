"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

const formSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(1, {
      message: "Please enter your password",
    })
    .min(8, {
      message: "Password must be at least 7 characters long",
    }),
});

type SignInFormValues = z.infer<typeof formSchema>;

export const SignInForm = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const router = useRouter();

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(formSchema),
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
    onError: (error: Error) =>
      toast.error(error.message || "Failed to sign in"),
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
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/auth/forget-password"
                    className="text-muted-foreground text-sm font-medium hover:opacity-75"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormButton loading={isPending} className="mt-2">
            Login
          </FormButton>

          <SocialAuthButtons disabled={isPending} />
        </div>
      </Form>
    </div>
  );
};
