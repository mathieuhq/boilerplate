import { useMemo, useState } from "react";
import type { HTMLAttributes } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "@/i18n";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormButton } from "../form/form-button";

type VerificationMethod = "totp" | "backupCode";

const createTwoFactorFormSchema = (
  t: ReturnType<typeof useTranslations>,
  method: VerificationMethod,
) =>
  z.object({
    code:
      method === "totp"
        ? z
            .string()
            .trim()
            .regex(/^\d{6}$/, { message: t("validation.totpCode") })
        : z
            .string()
            .trim()
            .min(1, { message: t("validation.backupCodeRequired") }),
  });

type TwoFactorFormValues = { code: string };

type SignTwoFactorFormProps = HTMLAttributes<HTMLDivElement> & {
  callbackUrl?: string;
};

export const SignTwoFactorForm = ({
  callbackUrl = "/",
  className,
  ...props
}: SignTwoFactorFormProps) => {
  const router = useRouter();
  const t = useTranslations("auth");

  const [method, setMethod] = useState<VerificationMethod>("totp");
  const [trustDevice, setTrustDevice] = useState(false);

  const formSchema = useMemo(
    () => createTwoFactorFormSchema(t, method),
    [t, method],
  );
  const resolver = useMemo(() => zodResolver(formSchema), [formSchema]);

  const form = useForm<TwoFactorFormValues>({
    resolver,
    defaultValues: { code: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ code }: TwoFactorFormValues) => {
      const response =
        method === "totp"
          ? await authClient.twoFactor.verifyTotp({ code, trustDevice })
          : await authClient.twoFactor.verifyBackupCode({ code, trustDevice });

      if (response.error) throw new Error(response.error.message);

      return response;
    },
    onSuccess: () => router.push(callbackUrl),
    onError: (error: Error) =>
      toast.error(error.message || t("twoFactorVerifyError")),
  });

  const toggleMethod = () => {
    setMethod((current) => (current === "totp" ? "backupCode" : "totp"));
    form.reset({ code: "" });
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form form={form} disabled={isPending} onSubmit={async (v) => mutate(v)}>
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {method === "totp" ? t("totpCode") : t("backupCode")}
                </FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    autoComplete="one-time-code"
                    inputMode={method === "totp" ? "numeric" : "text"}
                    placeholder={
                      method === "totp" ? "123456" : t("backupCodePlaceholder")
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-2">
            <Switch
              id="trust-device"
              checked={trustDevice}
              disabled={isPending}
              onCheckedChange={setTrustDevice}
            />
            <Label htmlFor="trust-device">{t("trustDevice")}</Label>
          </div>

          <FormButton loading={isPending}>{t("verify")}</FormButton>

          <button
            type="button"
            onClick={toggleMethod}
            className="rounded-sm text-sm font-medium text-muted-foreground transition-opacity outline-none hover:opacity-75 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:opacity-60"
          >
            {method === "totp" ? t("useBackupCode") : t("useAuthenticatorApp")}
          </button>
        </div>
      </Form>
    </div>
  );
};
