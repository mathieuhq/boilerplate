"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { inviteOrganizationMemberAction } from "@/actions/organization/organization.action";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getActionErrorMessage,
  isActionSuccessful,
} from "@/lib/actions/actions-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { FormButton } from "../../form/form-button";

type OrganizationInviteMemberFormProps = {
  organizationId: string;
  onCancelAction?: () => void;
  onSuccessAction?: () => void;
};

export const OrganizationInviteMemberForm = ({
  onCancelAction,
  organizationId,
  onSuccessAction,
}: OrganizationInviteMemberFormProps) => {
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");

  const formSchema = useMemo(
    () =>
      z.object({
        email: z.email({ message: t("validation.emailInvalid") }),
        role: z.enum(["admin", "member"]),
      }),
    [t],
  );

  type FormValues = z.infer<typeof formSchema>;

  const resolver = useMemo(() => zodResolver(formSchema), [formSchema]);

  const form = useForm<FormValues>({
    resolver,
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const { mutate, isPending: isSending } = useMutation({
    mutationFn: async (data: FormValues) => {
      const result = await inviteOrganizationMemberAction({
        organizationId,
        email: data.email,
        role: data.role,
      });

      if (!isActionSuccessful(result))
        throw new Error(getActionErrorMessage(result));

      return result.data;
    },
    onSuccess: () => {
      toast.success(t("invite.success"));
      form.reset({ email: "", role: "member" });
      onSuccessAction?.();
    },
    onError: (error: Error) => toast.error(error.message || t("invite.error")),
  });

  return (
    <Form
      form={form}
      disabled={isSending}
      onSubmit={async (v) => mutate(v)}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle>{t("invite.title")}</DialogTitle>
        <DialogDescription>{t("invite.description")}</DialogDescription>
      </DialogHeader>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("invite.email")}</FormLabel>
            <FormControl>
              <Input
                type="email"
                autoComplete="email"
                placeholder={t("invite.emailPlaceholder")}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("invite.role")}</FormLabel>
            <Select
              disabled={isSending}
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("invite.role")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="member">{t("roles.member")}</SelectItem>
                <SelectItem value="admin">{t("roles.admin")}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={isSending}
          onClick={onCancelAction}
        >
          {tCommon("cancel")}
        </Button>
        <FormButton loading={isSending} type="submit">
          {t("invite.send")}
        </FormButton>
      </DialogFooter>
    </Form>
  );
};
