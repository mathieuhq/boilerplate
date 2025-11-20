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
import { cn } from "@/lib/utils";
import { authClientService } from "@/services/auth/auth-client.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { FormButton } from "../form/form-button";

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Please enter your email" })
    .email({ message: "Invalid email address" }),
});

type SignResetFormValues = z.infer<typeof formSchema>;

export const SignResetForm = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const form = useForm<SignResetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: SignResetFormValues) =>
      authClientService.forgetPassword({
        email: data.email,
      }),
    onSuccess: () => {
      toast.success("Password reset email sent! Check your inbox.");
      form.reset();
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to send password reset email"),
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
          <FormButton loading={isPending} className="mt-2">
            Send Reset Link
          </FormButton>
        </div>
      </Form>
    </div>
  );
};
